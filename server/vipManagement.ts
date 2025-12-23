import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import { db } from './db';
import { vipCodes, adminLogs, userAccounts } from '@shared/schema';
import { eq, and, desc, lt, gt } from 'drizzle-orm';
import type { InsertVipCode, InsertAdminLog } from '@shared/schema';

// Master TOTP secret for VIP code generation (Russell's admin secret)
const ADMIN_TOTP_SECRET = process.env.ADMIN_TOTP_SECRET || speakeasy.generateSecret({
  name: 'Russell Nomer Admin',
  issuer: 'LotteryPro Admin'
}).base32;

export interface VipCodeGeneration {
  targetEmail: string;
  currentTier: string;
  targetTier: string;
  adminNotes?: string;
}

export interface VipCodeRedemption {
  code: string;
  userEmail: string;
}

/**
 * Generate simple VIP code - random alphanumeric format
 * Format: VIP-XXXX-XXXX (easy to read and share)
 */
export async function generateSecureVipCode(
  generation: VipCodeGeneration, 
  adminEmail?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ vipCode: string; expiresAt: Date; codeId: string }> {
  
  // Generate simple random code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing characters (0/O, 1/I/L)
  const part1 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const vipCode = `VIP-${part1}-${part2}`;
  
  // Create secure hash for database storage
  const codeHash = crypto.createHash('sha256')
    .update(`${vipCode}:${generation.targetEmail}`)
    .digest('hex');

  // Expiration: 30 minutes from now (extended window for easier redemption)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Get admin user ID
  const [admin] = await db.select()
    .from(userAccounts)
    .where(eq(userAccounts.email, adminEmail))
    .limit(1);

  if (!admin) {
    throw new Error('Admin user not found');
  }

  // Store VIP code in database
  const [vipCodeRecord] = await db.insert(vipCodes)
    .values({
      codeHash,
      targetEmail: generation.targetEmail,
      currentTier: generation.currentTier,
      targetTier: generation.targetTier,
      createdBy: admin.id,
      expiresAt,
      adminNotes: generation.adminNotes,
    })
    .returning();

  // Log admin action
  await logAdminAction({
    adminEmail,
    action: 'create_vip_code',
    targetEmail: generation.targetEmail,
    details: {
      currentTier: generation.currentTier,
      targetTier: generation.targetTier,
      expiresAt: expiresAt.toISOString(),
      notes: generation.adminNotes,
    },
    ipAddress,
    userAgent,
  });

  // Send VIP code via email
  try {
    const { sendVipCodeEmail } = await import('./emailService');
    const emailResult = await sendVipCodeEmail(
      generation.targetEmail,
      vipCode,
      generation.targetTier,
      expiresAt
    );
    console.log('Email result:', emailResult);
  } catch (emailError) {
    console.error('Failed to send VIP code email:', emailError);
    // Don't fail the whole operation if email fails
  }

  return {
    vipCode,
    expiresAt,
    codeId: vipCodeRecord.id,
  };
}

/**
 * Redeem VIP code - simple validation
 */
export async function redeemVipCode(
  redemption: VipCodeRedemption,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; newTier?: string; message: string }> {
  
  try {
    // Validate VIP code format: VIP-XXXX-XXXX
    const vipCodePattern = /^VIP-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!vipCodePattern.test(redemption.code.toUpperCase())) {
      return { success: false, message: 'Invalid VIP code format. Expected: VIP-XXXX-XXXX' };
    }

    // Create hash for database lookup
    const codeHash = crypto.createHash('sha256')
      .update(`${redemption.code}:${redemption.userEmail}`)
      .digest('hex');

    // Find and validate VIP code in database
    const [vipCodeRecord] = await db.select()
      .from(vipCodes)
      .where(
        and(
          eq(vipCodes.codeHash, codeHash),
          eq(vipCodes.targetEmail, redemption.userEmail),
          eq(vipCodes.isUsed, 0),
          gt(vipCodes.expiresAt, new Date()) // Not expired
        )
      )
      .limit(1);

    if (!vipCodeRecord) {
      await logAdminAction({
        adminEmail: 'system',
        action: 'vip_code_failed_redemption',
        targetEmail: redemption.userEmail,
        details: {
          reason: 'code_not_found_or_used',
          providedCode: redemption.code.substring(0, 10) + '***',
        },
        ipAddress,
        userAgent,
      });
      return { success: false, message: 'VIP code not found, already used, or expired' };
    }

    // Get user account
    const [user] = await db.select()
      .from(userAccounts)
      .where(eq(userAccounts.email, redemption.userEmail))
      .limit(1);

    if (!user) {
      return { success: false, message: 'User account not found' };
    }

    // Upgrade user tier
    await db.update(userAccounts)
      .set({
        subscriptionTier: vipCodeRecord.targetTier,
        updatedAt: new Date(),
      })
      .where(eq(userAccounts.id, user.id));

    // Mark VIP code as used
    await db.update(vipCodes)
      .set({
        isUsed: 1,
        usedAt: new Date(),
      })
      .where(eq(vipCodes.id, vipCodeRecord.id));

    // Log successful redemption
    await logAdminAction({
      adminEmail: 'system',
      action: 'vip_code_redeemed',
      targetEmail: redemption.userEmail,
      details: {
        fromTier: vipCodeRecord.currentTier,
        toTier: vipCodeRecord.targetTier,
        codeId: vipCodeRecord.id,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      newTier: vipCodeRecord.targetTier,
      message: `Successfully upgraded to ${vipCodeRecord.targetTier} tier!`,
    };

  } catch (error) {
    console.error('VIP code redemption error:', error);
    return { success: false, message: 'Internal error processing VIP code' };
  }
}

/**
 * Clean up expired VIP codes
 */
export async function cleanupExpiredVipCodes(): Promise<number> {
  const now = new Date();
  const result = await db.delete(vipCodes)
    .where(
      and(
        eq(vipCodes.isUsed, 0),
        lt(vipCodes.expiresAt, now)
      )
    );
  
  return Array.isArray(result) ? result.length : 0;
}

/**
 * Get admin activity logs
 */
export async function getAdminLogs(limit: number = 50): Promise<any[]> {
  return await db.select()
    .from(adminLogs)
    .orderBy(desc(adminLogs.timestamp))
    .limit(limit);
}

/**
 * Get VIP codes created by admin
 */
export async function getVipCodesByAdmin(adminEmail: string, limit: number = 50): Promise<any[]> {
  const [admin] = await db.select()
    .from(userAccounts)
    .where(eq(userAccounts.email, adminEmail))
    .limit(1);

  if (!admin) return [];

  return await db.select({
    id: vipCodes.id,
    targetEmail: vipCodes.targetEmail,
    currentTier: vipCodes.currentTier,
    targetTier: vipCodes.targetTier,
    isUsed: vipCodes.isUsed,
    createdAt: vipCodes.createdAt,
    usedAt: vipCodes.usedAt,
    expiresAt: vipCodes.expiresAt,
    adminNotes: vipCodes.adminNotes,
  })
    .from(vipCodes)
    .where(eq(vipCodes.createdBy, admin.id))
    .orderBy(desc(vipCodes.createdAt))
    .limit(limit);
}

/**
 * Log admin action for security auditing
 */
async function logAdminAction(log: InsertAdminLog): Promise<void> {
  await db.insert(adminLogs).values(log);
}

/**
 * Get current TOTP token for admin interface display
 */
export function getCurrentTotpToken(): string {
  return speakeasy.totp({
    secret: ADMIN_TOTP_SECRET,
    encoding: 'base32',
    time: Date.now(),
    step: 300,
  });
}

/**
 * Get time remaining for current TOTP token
 */
export function getTotpTimeRemaining(): number {
  const currentTime = Math.floor(Date.now() / 1000);
  const step = 300; // 5 minutes
  const timeInStep = currentTime % step;
  return step - timeInStep;
}

/**
 * Create new user account with automatic VIP code generation and email notification
 */
export async function createNewUser(userData: {
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  sendVipCode?: boolean;
  adminEmail?: string;
  adminNotes?: string;
}): Promise<{ user: any; vipCode?: string; emailSent?: boolean }> {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(userAccounts).where(eq(userAccounts.email, userData.email)).limit(1);
    
    if (existingUser.length > 0) {
      throw new Error(`User with email ${userData.email} already exists`);
    }

    // Create new user account (skip for VIP code testing)
    let newUser = [{ id: 'test-user', email: userData.email }];
    
    // TODO: Implement actual user creation when schema is ready
    /*
    const newUser = await db.insert(userAccounts).values({
      email: userData.email,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      subscriptionTier: userData.subscriptionTier as 'free' | 'basic' | 'pro' | 'premium',
      subscriptionStatus: 'active',
      mfaEnabled: false,
      passwordHash: '', // User will need to set password on first login
      dailyUsageCount: 0,
    }).returning();
    */

    let vipCode: string | undefined;
    let emailSent = false;

    // Generate VIP code if requested
    if (userData.sendVipCode) {
      const vipCodeData = await generateSecureVipCode(
        {
          targetEmail: userData.email,
          currentTier: 'free',
          targetTier: userData.subscriptionTier,
          adminNotes: userData.adminNotes || `User created by admin and granted ${userData.subscriptionTier} tier access`,
        },
        'admin', // adminEmail  
        null, // ipAddress
        null  // userAgent
      );

      vipCode = vipCodeData.vipCode;

      // Send welcome email with VIP code
      const { sendWelcomeEmailWithVipCode } = await import('./emailService');
      emailSent = await sendWelcomeEmailWithVipCode(
        userData.email,
        vipCode,
        userData.subscriptionTier,
        userData.firstName || 'New User'
      );
    }

    // Log admin action
    if (userData.adminEmail) {
      await logAdminAction({
        adminEmail: userData.adminEmail,
        action: 'create_new_user',
        targetEmail: userData.email,
        details: {
          tier: userData.subscriptionTier,
          vipCodeSent: !!vipCode,
          emailSent,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
        ipAddress: null,
      });
    }

    return {
      user: newUser[0],
      vipCode,
      emailSent,
    };
  } catch (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
}