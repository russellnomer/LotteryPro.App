import { Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";

// Russell Nomer's god-like admin email
const RUSSELL_EMAIL = "russell@russellnomer.com";

// VIP code creation schema
const createVipCodeSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Code too long"),
  subscriptionTier: z.enum(["basic", "pro", "premium"], {
    required_error: "Invalid subscription tier"
  }),
  expiresAt: z.string().optional().transform(str => str ? new Date(str) : undefined)
});

// VIP code redemption schema
const redeemVipCodeSchema = z.object({
  code: z.string().min(1, "Code is required")
});

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        subscriptionTier: string;
      };
    }
  }
}

// Check if user is Russell (god-mode)
function isRussellNomer(userEmail: string): boolean {
  return userEmail.toLowerCase() === RUSSELL_EMAIL.toLowerCase();
}

// Russell's VIP code creation endpoint (god-like powers)
export async function createVipCode(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only Russell can create VIP codes
    if (!isRussellNomer(req.user.email)) {
      console.warn('SECURITY_LOG - Unauthorized VIP code creation attempt:', {
        timestamp: new Date().toISOString(),
        email: req.user.email,
        ip: req.ip,
        reason: 'Not Russell Nomer'
      });
      return res.status(403).json({ error: "Insufficient privileges" });
    }

    const { code, subscriptionTier, expiresAt } = createVipCodeSchema.parse(req.body);

    // Check if code already exists
    const existingCode = await storage.getVipCodeByCode(code);
    if (existingCode) {
      return res.status(400).json({ error: "Code already exists" });
    }

    const vipCode = await storage.createVipCode({
      code,
      subscriptionTier,
      createdBy: req.user.id,
      expiresAt,
      isActive: 1
    });

    console.log('VIP_LOG - Russell created new VIP code:', {
      timestamp: new Date().toISOString(),
      code: code,
      tier: subscriptionTier,
      createdBy: req.user.email,
      expiresAt
    });

    res.json({
      success: true,
      message: `VIP code '${code}' created for ${subscriptionTier} tier`,
      vipCode: {
        id: vipCode.id,
        code: vipCode.code,
        subscriptionTier: vipCode.subscriptionTier,
        expiresAt: vipCode.expiresAt,
        createdAt: vipCode.createdAt
      }
    });

  } catch (error: any) {
    console.error("Error creating VIP code:", error);
    if (error.issues) {
      return res.status(400).json({ error: error.issues[0]?.message || "Invalid input" });
    }
    res.status(500).json({ error: "Failed to create VIP code" });
  }
}

// Get Russell's created VIP codes
export async function getMyVipCodes(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only Russell can view his VIP codes
    if (!isRussellNomer(req.user.email)) {
      return res.status(403).json({ error: "Insufficient privileges" });
    }

    const vipCodes = await storage.getUserVipCodes(req.user.id);

    res.json({
      success: true,
      vipCodes: vipCodes.map(code => ({
        id: code.id,
        code: code.code,
        subscriptionTier: code.subscriptionTier,
        isActive: code.isActive,
        usedBy: code.usedBy,
        usedAt: code.usedAt,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt
      }))
    });

  } catch (error) {
    console.error("Error fetching VIP codes:", error);
    res.status(500).json({ error: "Failed to fetch VIP codes" });
  }
}

// Redeem a VIP code (available to all users)
export async function redeemVipCode(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { code } = redeemVipCodeSchema.parse(req.body);

    const vipCode = await storage.redeemVipCode(code, req.user.id);

    if (!vipCode) {
      console.warn('VIP_LOG - Invalid VIP code redemption attempt:', {
        timestamp: new Date().toISOString(),
        code: code,
        user: req.user.email,
        ip: req.ip
      });
      return res.status(400).json({ error: "Invalid or expired VIP code" });
    }

    // Update user's subscription tier
    await storage.updateUserSubscriptionTier(req.user.id, vipCode.subscriptionTier);

    console.log('VIP_LOG - Successful VIP code redemption:', {
      timestamp: new Date().toISOString(),
      code: code,
      user: req.user.email,
      newTier: vipCode.subscriptionTier,
      createdBy: vipCode.createdBy
    });

    res.json({
      success: true,
      message: `Congratulations! You now have ${vipCode.subscriptionTier} access`,
      subscriptionTier: vipCode.subscriptionTier
    });

  } catch (error: any) {
    console.error("Error redeeming VIP code:", error);
    if (error.issues) {
      return res.status(400).json({ error: error.issues[0]?.message || "Invalid input" });
    }
    res.status(500).json({ error: "Failed to redeem VIP code" });
  }
}

// Deactivate a VIP code (Russell only)
export async function deactivateVipCode(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Only Russell can deactivate VIP codes
    if (!isRussellNomer(req.user.email)) {
      return res.status(403).json({ error: "Insufficient privileges" });
    }

    const { codeId } = req.params;

    await storage.deactivateVipCode(codeId);

    console.log('VIP_LOG - Russell deactivated VIP code:', {
      timestamp: new Date().toISOString(),
      codeId: codeId,
      deactivatedBy: req.user.email
    });

    res.json({
      success: true,
      message: "VIP code deactivated successfully"
    });

  } catch (error) {
    console.error("Error deactivating VIP code:", error);
    res.status(500).json({ error: "Failed to deactivate VIP code" });
  }
}