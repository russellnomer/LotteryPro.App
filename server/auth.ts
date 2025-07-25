import { Request, Response } from 'express';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
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
  subscriptionTier: z.enum(['basic', 'pro', 'premium'])
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
    const { email, password, subscriptionTier } = registerSchema.parse(req.body);
    
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
      mfaEnabled: 0 // MFA setup required after registration
    });

    res.json({ 
      success: true, 
      userId: user.id,
      message: 'Account created successfully. Please set up MFA to secure your account.',
      requiresMFA: true
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return res.status(200).json({ 
          requiresMFA: true,
          message: 'Please enter your 6-digit authentication code from Google Authenticator'
        });
      }

      // Verify MFA code
      const validMFA = MFAService.verifyToken(user.mfaSecret!, mfaCode);
      if (!validMFA) {
        return res.status(401).json({ error: 'Invalid authentication code' });
      }
    } else {
      // Force MFA setup for all subscribers
      return res.status(200).json({
        requiresMFASetup: true,
        userId: user.id,
        message: 'Multi-factor authentication is required for all subscribers. Please set up Google Authenticator.'
      });
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
  return require('crypto').randomBytes(32).toString('hex');
}

// Middleware to check authentication and MFA
export async function requireAuth(req: Request, res: Response, next: any) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
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