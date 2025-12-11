import express, { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { storage } from '../storage';

const router = Router();

function createHash(data: string): string {
  return crypto.createHmac('sha256', 'lottery-verification-salt').update(data).digest('hex');
}

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

    const requiredFields = { email, firstName, lastName, streetAddress, city, state, zipCode, mobileNumber };
    const missing = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    const emailHash = createHash(email.toLowerCase());
    const mobileNumberHash = createHash(mobileNumber);

    const existingProfile = await storage.getCustomerProfileByEmail(emailHash);
    if (existingProfile) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const profile = await storage.createCustomerProfile({
      email: email.toLowerCase(),
      emailHash,
      firstName,
      lastName,
      streetAddress,
      city,
      state,
      zipCode,
      mobileNumber,
      mobileNumberHash,
      marketingOptIn: marketingOptIn || false,
      emailVerified: false,
      mobileVerified: false,
      isProfileComplete: false,
      accountApproved: false
    });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (preferredVerification === 'email') {
      await storage.createEmailVerificationCode({
        email: email.toLowerCase(),
        emailHash,
        verificationCode,
        expiresAt,
        isUsed: false,
        attempts: 0
      });
      console.log(`📧 Email verification code for ${email}: ${verificationCode}`);
    } else {
      await storage.createSmsVerificationCode({
        mobileNumber,
        mobileNumberHash,
        verificationCode,
        expiresAt,
        isUsed: false,
        attempts: 0
      });
      console.log(`📱 SMS verification code for ${mobileNumber}: ${verificationCode}`);
    }

    req.session.customerId = profile.id;

    res.json({ 
      success: true, 
      customerId: profile.id,
      message: `Verification code sent via ${preferredVerification}`
    });

  } catch (error: any) {
    console.error('Profile creation error:', error);
    res.status(500).json({ message: error.message || 'Failed to create profile' });
  }
});

router.post('/send-verification', async (req: Request, res: Response) => {
  try {
    const { customerId, method } = req.body;
    
    const profile = await storage.getCustomerProfile(customerId);
    if (!profile) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (method === 'email') {
      await storage.createEmailVerificationCode({
        email: profile.email,
        emailHash: profile.emailHash,
        verificationCode,
        expiresAt,
        isUsed: false,
        attempts: 0
      });
      console.log(`📧 Email verification code for ${profile.email}: ${verificationCode}`);
    } else {
      await storage.createSmsVerificationCode({
        mobileNumber: profile.mobileNumber,
        mobileNumberHash: profile.mobileNumberHash,
        verificationCode,
        expiresAt,
        isUsed: false,
        attempts: 0
      });
      console.log(`📱 SMS verification code for ${profile.mobileNumber}: ${verificationCode}`);
    }

    res.json({ success: true, message: `Verification code sent via ${method}` });

  } catch (error: any) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: error.message || 'Failed to send verification code' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { customerId, code, method } = req.body;
    
    const profile = await storage.getCustomerProfile(customerId);
    if (!profile) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    let isValid = false;
    
    if (method === 'email') {
      const verificationRecord = await storage.getEmailVerificationCode(profile.emailHash, code);
      if (verificationRecord && !verificationRecord.isUsed && verificationRecord.expiresAt > new Date()) {
        isValid = true;
        await storage.markEmailVerificationAsUsed(verificationRecord.id);
        await storage.updateCustomerProfile(customerId, {
          emailVerified: true,
          accountApproved: true,
          isProfileComplete: true
        });
      }
    } else {
      const verificationRecord = await storage.getSmsVerificationCode(profile.mobileNumberHash, code);
      if (verificationRecord && !verificationRecord.isUsed && verificationRecord.expiresAt > new Date()) {
        isValid = true;
        await storage.markSmsVerificationAsUsed(verificationRecord.id);
        await storage.updateCustomerProfile(customerId, {
          mobileVerified: true,
          accountApproved: true,
          isProfileComplete: true
        });
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    req.session.customerId = customerId;
    req.session.profileVerified = true;

    res.json({ 
      success: true, 
      message: 'Account verified and approved for full system access' 
    });

  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({ message: error.message || 'Failed to verify code' });
  }
});

router.get('/profile/:id', async (req: Request, res: Response) => {
  try {
    const profile = await storage.getCustomerProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    const { emailHash, mobileNumberHash, ...safeProfile } = profile;
    res.json(safeProfile);
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message || 'Failed to get profile' });
  }
});

export default router;
