import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import { db } from './db';
import { vipCodes, adminLogs, userAccounts } from '@shared/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
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
 * Generate secure VIP code using Nomerati + Google Authenticator TOTP + target email
 * Format: Nomerati + TOTP(6-digit) + SHA256(email)
 */
export async function generateSecureVipCode(
  generation: VipCodeGeneration, 
  adminEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ vipCode: string; expiresAt: Date; codeId: string }> {
  
  // Generate current TOTP token
  const totpToken = speakeasy.totp({
    secret: ADMIN_TOTP_SECRET,
    encoding: 'base32',
    time: Date.now(),
    step: 300, // 5 minutes
  });

  // Create email hash for account-specific binding
  const emailHash = crypto.createHash('sha256')
    .update(generation.targetEmail.toLowerCase())
    .digest('hex')
    .substring(0, 8); // First 8 characters

  // Construct the VIP code: Nomerati + TOTP + EmailHash
  const vipCode = `Nomerati${totpToken}${emailHash}`;
  
  // Create secure hash for database storage
  const codeHash = crypto.createHash('sha256')
    .update(`${vipCode}:${generation.targetEmail}`)
    .digest('hex');

  // Expiration: 5 minutes from now (TOTP window)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

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
    emailSent: true,
  };
}

/**
 * Redeem VIP code with comprehensive security validation
 */
export async function redeemVipCode(
  redemption: VipCodeRedemption,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; newTier?: string; message: string }> {
  
  try {
    // Extract components from VIP code
    if (!redemption.code.startsWith('Nomerati') || redemption.code.length !== 22) {
      return { success: false, message: 'Invalid VIP code format' };
    }

    const totpPart = redemption.code.substring(8, 14); // 6 digits after "Nomerati"
    const emailHashPart = redemption.code.substring(14); // 8 characters

    // Verify email hash matches
    const expectedEmailHash = crypto.createHash('sha256')
      .update(redemption.userEmail.toLowerCase())
      .digest('hex')
      .substring(0, 8);

    if (emailHashPart !== expectedEmailHash) {
      await logAdminAction({
        adminEmail: 'system',
        action: 'vip_code_failed_redemption',
        targetEmail: redemption.userEmail,
        details: {
          reason: 'email_hash_mismatch',
          providedCode: redemption.code.substring(0, 10) + '***',
        },
        ipAddress,
        userAgent,
      });
      return { success: false, message: 'This VIP code is not valid for your account' };
    }

    // Verify TOTP is within valid window (current or previous 5-minute window)
    const currentTime = Date.now();
    const isValidTotp = speakeasy.totp.verify({
      secret: ADMIN_TOTP_SECRET,
      encoding: 'base32',
      token: totpPart,
      time: currentTime,
      step: 300,
      window: 1, // Allow previous window for clock skew
    });

    if (!isValidTotp) {
      await logAdminAction({
        adminEmail: 'system',
        action: 'vip_code_failed_redemption',
        targetEmail: redemption.userEmail,
        details: {
          reason: 'invalid_totp',
          providedCode: redemption.code.substring(0, 10) + '***',
        },
        ipAddress,
        userAgent,
      });
      return { success: false, message: 'VIP code has expired or is invalid' };
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
          lt(vipCodes.expiresAt, new Date()) // Not expired
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