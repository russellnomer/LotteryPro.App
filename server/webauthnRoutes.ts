import { Request, Response } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { db } from './db';
import { webauthnCredentials, userAccounts, userSessions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const PAID_TIERS = ['basic', 'pro', 'premium', 'founder', 'lifetime', 'unlimited'];

function getRpDetails(req: Request) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return {
      rpID: 'lotterypro.app',
      origin: 'https://lotterypro.app',
    };
  }
  const host = req.get('host') || 'localhost:5000';
  const rpID = host.split(':')[0];
  const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'https';
  return {
    rpID,
    origin: `${proto}://${host}`,
  };
}

// In-memory challenge store (TTL = 5 minutes)
const challengeStore = new Map<string, { challenge: string; expiresAt: number; email?: string }>();

function storeChallenge(key: string, challenge: string, email?: string) {
  challengeStore.set(key, { challenge, expiresAt: Date.now() + 5 * 60 * 1000, email });
}

function consumeChallenge(key: string): { challenge: string; email?: string } | null {
  const entry = challengeStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    challengeStore.delete(key);
    return null;
  }
  challengeStore.delete(key);
  return { challenge: entry.challenge, email: entry.email };
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── REGISTRATION ────────────────────────────────────────────────────────────

export async function webauthnRegisterOptions(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'You must be signed in to set up biometric login.' });

    if (!PAID_TIERS.includes(user.subscriptionTier || '')) {
      return res.status(403).json({
        error: 'Biometric login is available to paid subscribers. Upgrade your plan to enable this feature.',
        upgradeRequired: true,
      });
    }

    const existingCreds = await db.select({ credentialId: webauthnCredentials.credentialId })
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.userId, user.id));

    const { rpID } = getRpDetails(req);

    const options = await generateRegistrationOptions({
      rpName: 'LotteryPro',
      rpID,
      userName: user.email,
      userDisplayName: user.email,
      userID: isoBase64URL.fromBuffer(Buffer.from(user.id)),
      attestationType: 'none',
      excludeCredentials: existingCreds.map(c => ({
        id: c.credentialId,
        transports: ['internal', 'hybrid'] as any,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    storeChallenge(`reg:${user.id}`, options.challenge);
    res.json(options);
  } catch (err: any) {
    console.error('WebAuthn register options error:', err);
    res.status(500).json({ error: 'Failed to generate registration options.' });
  }
}

export async function webauthnRegisterVerify(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'You must be signed in.' });

    const { response, deviceName } = req.body;
    if (!response) return res.status(400).json({ error: 'Missing registration response.' });

    const stored = consumeChallenge(`reg:${user.id}`);
    if (!stored) return res.status(400).json({ error: 'Challenge expired. Please try again.' });

    const { rpID, origin } = getRpDetails(req);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Biometric verification failed. Please try again.' });
    }

    const { credential } = verification.registrationInfo;

    await db.insert(webauthnCredentials).values({
      userId: user.id,
      credentialId: credential.id,
      publicKey: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      deviceName: deviceName || detectDeviceName(response),
      transports: response.response?.transports || [],
    });

    console.log(`✅ WebAuthn credential registered for ${user.email}`);
    res.json({ success: true, message: 'Biometric login set up successfully.' });
  } catch (err: any) {
    console.error('WebAuthn register verify error:', err);
    res.status(500).json({ error: err.message || 'Registration failed. Please try again.' });
  }
}

// ─── AUTHENTICATION ──────────────────────────────────────────────────────────

export async function webauthnLoginOptions(req: Request, res: Response) {
  try {
    const { email } = req.body;

    let allowCredentials: any[] = [];
    let challengeKey = `auth:${req.ip}`;

    if (email) {
      const [userRow] = await db.select({ id: userAccounts.id })
        .from(userAccounts)
        .where(eq(userAccounts.email, email.toLowerCase().trim()))
        .limit(1);

      if (userRow) {
        const creds = await db.select()
          .from(webauthnCredentials)
          .where(eq(webauthnCredentials.userId, userRow.id));

        allowCredentials = creds.map(c => ({
          id: c.credentialId,
          transports: (c.transports as string[] | null) || ['internal', 'hybrid'],
        }));
        challengeKey = `auth:${userRow.id}`;
      }
    }

    const { rpID } = getRpDetails(req);

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      allowCredentials,
    });

    storeChallenge(challengeKey, options.challenge, email);
    res.json({ ...options, challengeKey });
  } catch (err: any) {
    console.error('WebAuthn login options error:', err);
    res.status(500).json({ error: 'Failed to generate login options.' });
  }
}

export async function webauthnLoginVerify(req: Request, res: Response) {
  try {
    const { response, challengeKey } = req.body;
    if (!response || !challengeKey) return res.status(400).json({ error: 'Missing authentication data.' });

    const stored = consumeChallenge(challengeKey);
    if (!stored) return res.status(400).json({ error: 'Challenge expired. Please try again.' });

    const [cred] = await db.select()
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.credentialId, response.id))
      .limit(1);

    if (!cred) return res.status(401).json({ error: 'Biometric credential not recognised. Please sign in with your password.' });

    const { rpID, origin } = getRpDetails(req);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: cred.credentialId,
        publicKey: isoBase64URL.toBuffer(cred.publicKey),
        counter: cred.counter,
        transports: (cred.transports as any) || [],
      },
    });

    if (!verification.verified) {
      return res.status(401).json({ error: 'Biometric verification failed.' });
    }

    await db.update(webauthnCredentials)
      .set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() })
      .where(eq(webauthnCredentials.id, cred.id));

    const [user] = await db.select()
      .from(userAccounts)
      .where(eq(userAccounts.id, cred.userId))
      .limit(1);

    if (!user) return res.status(401).json({ error: 'Account not found.' });

    const sessionToken = generateSessionToken();
    const [session] = await db.insert(userSessions).values({
      userId: user.id,
      sessionToken,
      mfaVerified: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).returning();

    await db.update(userAccounts)
      .set({ lastLogin: new Date() })
      .where(eq(userAccounts.id, user.id));

    const cookieMaxAge = 30 * 24 * 60 * 60 * 1000;
    res.cookie('lp_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    console.log(`✅ WebAuthn login for ${user.email}`);
    res.json({
      success: true,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (err: any) {
    console.error('WebAuthn login verify error:', err);
    res.status(500).json({ error: err.message || 'Authentication failed. Please try again.' });
  }
}

// ─── MANAGE CREDENTIALS ──────────────────────────────────────────────────────

export async function webauthnListCredentials(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });

    const creds = await db.select({
      id: webauthnCredentials.id,
      deviceName: webauthnCredentials.deviceName,
      createdAt: webauthnCredentials.createdAt,
      lastUsedAt: webauthnCredentials.lastUsedAt,
    }).from(webauthnCredentials)
      .where(eq(webauthnCredentials.userId, user.id));

    res.json({ credentials: creds });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list credentials.' });
  }
}

export async function webauthnDeleteCredential(req: Request, res: Response) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });

    const { credentialId } = req.params;
    await db.delete(webauthnCredentials)
      .where(and(
        eq(webauthnCredentials.id, credentialId),
        eq(webauthnCredentials.userId, user.id)
      ));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove credential.' });
  }
}

function detectDeviceName(response: any): string {
  const transports: string[] = response.response?.transports || [];
  if (transports.includes('internal')) return 'This Device';
  if (transports.includes('hybrid')) return 'Phone / Tablet';
  if (transports.includes('usb')) return 'Security Key (USB)';
  if (transports.includes('nfc')) return 'Security Key (NFC)';
  return 'New Device';
}
