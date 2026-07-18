import { Request, Response } from 'express';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendVerificationEmail } from './emailService';
import { enrollUserInDripSequence } from './dripService';
import { db } from './db';
import { passwordResetTokens as passwordResetTokensTable, emailVerificationCodes, userAccounts, emailPreferences } from '@shared/schema';
import { eq, and, isNull, gt, gte } from 'drizzle-orm';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
import { storage } from './storage';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// MFA setup and verification functions
export class MFAService {
  static generateMFASecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `LotteryPro (${email})`,
      issuer: 'LotteryPro'
    });
    
    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url
    };
  }

  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 60 second window for clock drift
    });
  }

  static generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric codes
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  subscriptionTier: z.enum(['basic', 'pro', 'premium']),
  homeState: z.string().length(2).toUpperCase().optional(),
  marketingConsent: z.boolean().optional().default(false)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  mfaCode: z.string().optional()
});

const mfaSetupSchema = z.object({
  token: z.string().length(6)
});

// Auth routes
export async function register(req: Request, res: Response) {
  try {
    const { email, password, subscriptionTier, homeState, marketingConsent } = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user account
    const user = await storage.createUser({
      email,
      passwordHash,
      subscriptionTier,
      subscriptionStatus: 'active',
      mfaEnabled: 0, // MFA setup required after registration
      ...(homeState ? { homeState } : {})
    });

    // Persist marketing consent to email_preferences (GDPR/CCPA)
    await db.insert(emailPreferences).values({
      userId: user.id,
      email,
      promotionalEmails: marketingConsent ? 1 : 0,
      powerballReminders: 1,
      megamillionsReminders: 1,
      weeklyDigest: 1,
    }).onConflictDoNothing();

    // Generate 6-digit OTP for email verification (15-min TTL)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    await db.insert(emailVerificationCodes).values({
      email,
      emailHash,
      verificationCode: otpCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Send verification email (non-blocking — registration succeeds regardless)
    sendVerificationEmail(email, otpCode).catch(err =>
      console.error('Failed to send verification email:', err)
    );

    // Enroll new user in free-to-paid drip sequence (non-blocking)
    enrollUserInDripSequence(user.id, email).catch(err =>
      console.error('Failed to enroll user in drip sequence:', err)
    );

    res.json({ 
      success: true, 
      userId: user.id,
      message: 'Account created. Please verify your email address.',
      requiresEmailVerification: true,
      requiresMFA: true
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// Verify email OTP — atomically consumes the code
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const now = new Date();
    // Atomically mark the code as used only if valid and unexpired
    const [record] = await db
      .update(emailVerificationCodes)
      .set({ isUsed: true })
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.verificationCode, code.trim()),
          eq(emailVerificationCodes.isUsed, false),
          gt(emailVerificationCodes.expiresAt, now)
        )
      )
      .returning();

    if (!record) {
      return res.status(400).json({ error: 'Invalid or expired code', code: 'invalid_code' });
    }

    // Mark user as verified
    await db.update(userAccounts)
      .set({ emailVerified: true })
      .where(eq(userAccounts.email, email));

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

// Resend verification email — 60-second cooldown enforced via DB
export async function resendVerification(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check user exists
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal existence
      return res.json({ success: true, message: 'If an account exists, a new code has been sent.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Rate limit: check most recent code sent in last 60 seconds
    // A code sent within 60s will have expiresAt > now + 14 minutes
    const recentCodes = await db.select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          gte(emailVerificationCodes.expiresAt, new Date(Date.now() + (15 * 60 - 60) * 1000))
        )
      )
      .limit(1);

    if (recentCodes.length > 0) {
      // expiresAt is createdAt + 15 min; so time-since-send = 15*60 - (expiresAt - now)/1000
      const msTillExpiry = recentCodes[0].expiresAt.getTime() - Date.now();
      const secondsSinceSend = Math.floor((15 * 60 * 1000 - msTillExpiry) / 1000);
      const wait = Math.max(1, 60 - secondsSinceSend);
      return res.status(429).json({ error: `Please wait ${wait} seconds before requesting a new code`, waitSeconds: wait });
    }

    // Generate and store new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    await db.insert(emailVerificationCodes).values({
      email,
      emailHash,
      verificationCode: otpCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await sendVerificationEmail(email, otpCode);

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password, mfaCode } = loginSchema.parse(req.body);
    
    // Get user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // MFA is optional - skip if not enabled or no code provided
    if (user.mfaEnabled && user.mfaSecret && mfaCode) {
      const validMFA = MFAService.verifyToken(user.mfaSecret, mfaCode);
      if (!validMFA) {
        return res.status(401).json({ error: 'Invalid authentication code' });
      }
    }

    // Create session
    const session = await storage.createUserSession({
      userId: user.id,
      sessionToken: generateSessionToken(),
      mfaVerified: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Set HttpOnly cookie for mobile compatibility (30 days)
    const cookieMaxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    res.cookie('lp_session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/'
    });

    res.json({
      success: true,
      sessionToken: session.sessionToken,
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function setupMFA(req: Request, res: Response) {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate MFA secret
    const { secret, qrCodeUrl } = MFAService.generateMFASecret(user.email);
    if (!qrCodeUrl) {
      return res.status(500).json({ error: 'Failed to generate MFA secret' });
    }
    const qrCodeImage = await MFAService.generateQRCode(qrCodeUrl);

    // Store secret temporarily (not enabled yet)
    await storage.updateUserMFASecret(userId, secret);

    res.json({
      qrCode: qrCodeImage,
      manualEntryKey: secret,
      instructions: {
        step1: 'Download Google Authenticator from your app store',
        step2: 'Scan this QR code or manually enter the key',
        step3: 'Enter the 6-digit code to verify setup'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function verifyMFASetup(req: Request, res: Response) {
  try {
    const { token } = mfaSetupSchema.parse(req.body);
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await storage.getUserById(userId);
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA setup not initiated' });
    }

    // Verify the token
    const validToken = MFAService.verifyToken(user.mfaSecret, token);
    if (!validToken) {
      return res.status(400).json({ error: 'Invalid authentication code. Please try again.' });
    }

    // Generate backup codes
    const backupCodes = MFAService.generateBackupCodes();

    // Enable MFA
    await storage.enableUserMFA(userId, backupCodes);

    res.json({
      success: true,
      message: 'MFA setup completed successfully!',
      backupCodes,
      important: 'Save these backup codes in a safe place. You can use them to access your account if you lose your phone.'
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to extract session token from request (header or cookie)
function getSessionToken(req: Request): string | undefined {
  // First check Authorization header (bearer token)
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  if (headerToken) {
    return headerToken;
  }
  
  // Fallback to HttpOnly cookie (for mobile/WebView)
  const cookieToken = req.cookies?.lp_session;
  return cookieToken;
}

// Logout - invalidate session
export async function logout(req: Request, res: Response) {
  try {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      return res.status(400).json({ error: 'No session to invalidate' });
    }

    await storage.deleteUserSession(sessionToken);
    
    // Clear the HttpOnly session cookie
    res.clearCookie('lp_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Middleware to check authentication and MFA
export async function requireAuth(req: Request, res: Response, next: any) {
  try {
    // Check both header and cookie for session token (mobile/desktop unified auth)
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = await storage.getUserSession(sessionToken);
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = await storage.getUserById(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if MFA is verified for this session
    if (!session.mfaVerified) {
      return res.status(401).json({ error: 'MFA verification required' });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Optional auth middleware - populates req.user if authenticated, but doesn't block guests
export async function optionalAuth(req: Request, res: Response, next: any) {
  try {
    // Check both header and cookie for session token (mobile/desktop unified auth)
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      return next(); // Not authenticated, continue as guest
    }

    const session = await storage.getUserSession(sessionToken);
    if (!session || session.expiresAt < new Date()) {
      return next(); // Invalid session, continue as guest
    }

    const user = await storage.getUserById(session.userId);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // On error, continue as guest
    next();
  }
}

// Subscription tier hierarchy: premium > pro > basic > free
const tierHierarchy: Record<string, number> = {
  'free': 0,
  'basic': 1,
  'pro': 2,
  'premium': 3,
  'admin': 99
};

// Middleware to require a minimum subscription tier
export function requireTier(minTier: 'basic' | 'pro' | 'premium') {
  return async (req: Request, res: Response, next: any) => {
    try {
      // Check both header and cookie for session token (mobile/desktop unified auth)
      const sessionToken = getSessionToken(req);
      if (!sessionToken) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const session = await storage.getUserSession(sessionToken);
      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Session expired' });
      }

      const user = await storage.getUserById(session.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!session.mfaVerified) {
        return res.status(401).json({ error: 'MFA verification required' });
      }

      // Check subscription status
      if (user.subscriptionStatus !== 'active') {
        return res.status(403).json({ 
          error: 'Subscription required',
          message: 'Please activate your subscription to access this feature'
        });
      }

      // Check tier level
      const userTierLevel = tierHierarchy[user.subscriptionTier || 'free'] || 0;
      const requiredTierLevel = tierHierarchy[minTier] || 0;

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({ 
          error: 'Upgrade required',
          message: `This feature requires ${minTier} tier or higher. Your current tier: ${user.subscriptionTier || 'free'}`,
          currentTier: user.subscriptionTier || 'free',
          requiredTier: minTier
        });
      }

      req.user = user;
      req.session = session;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization error' });
    }
  };
}

// Convenience middleware exports
export const requireBasic = requireTier('basic');
export const requirePro = requireTier('pro');
export const requirePremium = requireTier('premium');

// Middleware: requires email to be verified (for high-trust endpoints like pool create/join)
export async function requireVerifiedEmail(req: Request, res: Response, next: any) {
  try {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const session = await storage.getUserSession(sessionToken);
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }
    const user = await storage.getUserById(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Email verification required',
        code: 'email_not_verified',
        message: 'Please verify your email address before accessing this feature. Check your inbox for a 6-digit code or request a new one at /auth?verify=1'
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization error' });
  }
}

// Password Reset Functions — DB-backed (SHA-256 hashed, single-use, 30-min TTL)
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists (don't reveal this to the caller for security)
    const user = await storage.getUserByEmail(email);
    
    if (user) {
      // Generate a secure random token and store only its SHA-256 hash
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await db.insert(passwordResetTokensTable).values({
        email,
        tokenHash,
        expiresAt,
      });

      console.log(`Password reset requested for ${email}`);

      // Send email — falls back gracefully if transporter not configured
      const emailResult = await sendPasswordResetEmail(email, resetToken);

      return res.json({
        success: true,
        message: emailResult.success
          ? 'Password reset email sent — check your inbox (and spam folder).'
          : 'If an account exists with this email, you will receive reset instructions.',
      });
    }

    // Always return success for security (don't reveal whether the email exists)
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive reset instructions.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Hash the submitted token and atomically consume it in a single UPDATE ... RETURNING.
    // The WHERE clause requires used_at IS NULL, so only one concurrent request can win.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    const [tokenRecord] = await db
      .update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokensTable.tokenHash, tokenHash),
          isNull(passwordResetTokensTable.usedAt),
          gt(passwordResetTokensTable.expiresAt, now)
        )
      )
      .returning();

    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Get the user
    const user = await storage.getUserByEmail(tokenRecord.email);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash the new password and update
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await storage.updateUserPassword(user.id, passwordHash);

    console.log(`Password reset successful for ${tokenRecord.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

// Admin middleware - uses simple session-based authentication
export async function requireAdmin(req: Request, res: Response, next: any) {
  try {
    // Check session-based admin login (from /api/admin/login)
    if (req.session?.isAdmin) {
      return next();
    }

    // Fallback: Check both header and cookie for session token (mobile/desktop unified auth)
    const sessionToken = getSessionToken(req);
    if (sessionToken) {
      const session = await storage.getUserSession(sessionToken);
      if (session && session.expiresAt >= new Date()) {
        const user = await storage.getUserById(session.userId);
        if (user && (user.subscriptionTier === 'admin' || user.email === 'russell@russellnomer.com')) {
          req.user = user;
          return next();
        }
      }
    }

    return res.status(401).json({ error: 'Admin authentication required' });
  } catch (error) {
    res.status(500).json({ error: 'Authorization error' });
  }
}