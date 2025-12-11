import express, { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// In-memory verification codes (simple implementation)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; attempts: number }>();

// Simple hash function for verification
function createSimpleHash(data: string): string {
  return crypto.createHmac('sha256', 'lottery-verification-salt').update(data).digest('hex').slice(0, 16);
}

// Create customer profile with comprehensive data
router.post('/profile', async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      streetAddress, 
      city, 
      state, 
      zipCode, 
      mobileNumber, 
      preferredVerification,
      marketingOptIn 
    } = req.body;

    // Validate required fields
    const requiredFields = { email, firstName, lastName, streetAddress, city, state, zipCode, mobileNumber };
    const missing = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    // Generate a simple profile ID (in production, this would be from database)
    const profileId = crypto.randomUUID();
    
    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Store verification code in memory
    const verificationKey = preferredVerification === 'email' ? email : mobileNumber;
    verificationCodes.set(verificationKey, { 
      code: verificationCode, 
      expiresAt, 
      attempts: 0 
    });
    
    // Log verification code (in production, send via email/SMS)
    if (preferredVerification === 'email') {
      console.log(`📧 Email verification code for ${email}: ${verificationCode}`);
    } else {
      console.log(`📱 SMS verification code for ${mobileNumber}: ${verificationCode}`);
    }

    // Store profile data in session for later use
    req.session.pendingProfile = {
      id: profileId,
      email,
      firstName,
      lastName,
      streetAddress,
      city,
      state,
      zipCode,
      mobileNumber,
      marketingOptIn: marketingOptIn || false,
      verified: false,
      createdAt: new Date().toISOString()
    };

    res.json({ 
      success: true, 
      customerId: profileId,
      message: `Verification code sent via ${preferredVerification}`
    });

  } catch (error: any) {
    console.error('Profile creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create profile' });
  }
});

// Send verification code
router.post('/send-verification', async (req: Request, res: Response) => {
  try {
    const { email, mobileNumber, method } = req.body;
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    const verificationKey = method === 'email' ? email : mobileNumber;
    
    if (!verificationKey) {
      return res.status(400).json({ message: `Missing ${method} for verification` });
    }
    
    // Store in memory
    verificationCodes.set(verificationKey, { 
      code: verificationCode, 
      expiresAt, 
      attempts: 0 
    });
    
    if (method === 'email') {
      console.log(`📧 Email verification code for ${email}: ${verificationCode}`);
    } else {
      console.log(`📱 SMS verification code for ${mobileNumber}: ${verificationCode}`);
    }

    res.json({ success: true, message: `Verification code sent via ${method}` });

  } catch (error: any) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: error.message || 'Failed to send verification code' });
  }
});

// Verify code and approve account
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, mobileNumber, code, method } = req.body;
    
    const verificationKey = method === 'email' ? email : mobileNumber;
    
    if (!verificationKey) {
      return res.status(400).json({ message: `Missing ${method} for verification` });
    }
    
    const storedVerification = verificationCodes.get(verificationKey);
    
    if (!storedVerification) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }
    
    // Check if expired
    if (storedVerification.expiresAt < new Date()) {
      verificationCodes.delete(verificationKey);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    
    // Check attempts
    if (storedVerification.attempts >= 3) {
      verificationCodes.delete(verificationKey);
      return res.status(400).json({ message: 'Too many attempts. Please request a new code.' });
    }
    
    // Verify code
    if (storedVerification.code !== code) {
      storedVerification.attempts++;
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Success - remove the code
    verificationCodes.delete(verificationKey);
    
    // Mark profile as verified in session
    if (req.session.pendingProfile) {
      req.session.pendingProfile.verified = true;
      req.session.verifiedProfile = req.session.pendingProfile;
      delete req.session.pendingProfile;
    }

    res.json({ 
      success: true, 
      message: 'Account verified and approved for full system access' 
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({ message: error.message || 'Failed to verify code' });
  }
});

export default router;