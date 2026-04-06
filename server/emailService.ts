// Email service for VIP codes, draw day reminders, and verification
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { db } from './db';
import { emailPreferences, emailSendLog } from '@shared/schema';
import { eq } from 'drizzle-orm';

const FROM_ADDRESS = '"Russell Nomer \u2013 LotteryPro" <russell@lotterypro.app>';
const FROM_ADDRESS_RESEND = 'russell@lotterypro.app';

// Resend client — lazy initialized
let _resendClient: Resend | null | undefined;

function getResendClient(): Resend | null {
  if (_resendClient !== undefined) return _resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    _resendClient = null;
    return null;
  }
  _resendClient = new Resend(apiKey);
  return _resendClient;
}

// Gmail SMTP transporter — fallback when RESEND_API_KEY is absent
let _transporter: nodemailer.Transporter | null | undefined;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter !== undefined) return _transporter;
  const pass = process.env.LotteryPro_Email;
  if (!pass) {
    _transporter = null;
    return null;
  }
  _transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'russell@russellnomer.com',
      pass,
    },
  });
  return _transporter;
}

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendMail(data: EmailData): Promise<{ success: boolean; message: string }> {
  // Try Resend first (production-grade, high deliverability)
  const resend = getResendClient();
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_ADDRESS_RESEND,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
      });
      console.log(`✅ Email sent via Resend to ${data.to} — ${data.subject}`);
      return { success: true, message: `Email sent to ${data.to}` };
    } catch (err: any) {
      console.warn(`⚠️  Resend failed (${err?.message}), falling back to Gmail SMTP`);
    }
  }

  // Fallback: Gmail SMTP (dev behaviour from Task #3)
  const transporter = getTransporter();
  if (!transporter) {
    console.log('\n📧 EMAIL (no transport configured — would have sent):');
    console.log(`   To:      ${data.to}`);
    console.log(`   Subject: ${data.subject}`);
    console.log(`   Body:\n${data.text}`);
    return { success: false, message: 'Email service not configured — check server logs' };
  }
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: data.to,
    subject: data.subject,
    text: data.text,
    html: data.html,
  });
  console.log(`✅ Email sent via Gmail to ${data.to} — ${data.subject}`);
  return { success: true, message: `Email sent to ${data.to}` };
}

// Send email verification OTP — logs delivery status to email_send_log
export async function sendVerificationEmail(
  recipientEmail: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">🎰 Verify Your Email</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">LotteryPro by Russell Nomer</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; margin-top: 2px;">
        <h2 style="color: #333;">Your verification code</h2>
        <p style="color: #555;">Enter this 6-digit code to verify your email address. It expires in <strong>15 minutes</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #f4f4f8; border: 2px solid #667eea; border-radius: 12px; padding: 20px 40px;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #667eea; font-family: monospace;">${code}</span>
          </div>
        </div>
        <p style="color: #888; font-size: 14px;">If you did not create a LotteryPro account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">LotteryPro · Educational lottery analysis · <a href="https://lotterypro.app" style="color: #667eea;">lotterypro.app</a></p>
      </div>
    </div>
  `;
  const text = `Your LotteryPro verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not sign up, ignore this email.`;

  // Log the send attempt before sending
  const [logEntry] = await db.insert(emailSendLog).values({
    email: recipientEmail,
    emailType: 'email_verification',
    status: 'pending',
  }).returning({ id: emailSendLog.id });

  try {
    const result = await sendMail({ to: recipientEmail, subject: '🔐 Your LotteryPro verification code', text, html });
    if (result.success) {
      await db.update(emailSendLog)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(emailSendLog.id, logEntry.id));
    } else {
      await db.update(emailSendLog)
        .set({ status: 'failed', errorMessage: result.message })
        .where(eq(emailSendLog.id, logEntry.id));
    }
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await db.update(emailSendLog)
      .set({ status: 'failed', errorMessage: message })
      .where(eq(emailSendLog.id, logEntry.id));
    throw err;
  }
}

export async function sendVipCodeEmail(
  recipientEmail: string,
  vipCode: string,
  targetTier: string,
  expiresAt: Date
): Promise<{ success: boolean; message: string }> {
  return sendMail({
    to: recipientEmail,
    subject: '🎰 Your LotteryPro VIP Code - Russell Nomer Platform',
    text: `
🎰 LotteryPro VIP Account Upgrade

Hello!

Russell Nomer has generated a special VIP code for you:

VIP CODE: ${vipCode}

This code will upgrade your account to: ${targetTier.toUpperCase()} TIER

⚠️ IMPORTANT SECURITY FEATURES:
• This code is account-specific and bound to your email address
• Code expires at: ${expiresAt.toLocaleString()}
• Uses Google Authenticator TOTP for maximum security
• Cannot be hacked, transferred, or reused

🔗 REDEEM YOUR CODE:
Visit: https://lotterypro.app/admin
Scroll down to "Test VIP Code Redemption" section
Enter your email and the VIP code above

💎 Your New Benefits:
• Ad-free lottery experience
• Unlimited number generations
• Premium analysis features
• Priority customer support

Questions? Contact Russell directly!

Best regards,
The LotteryPro Team
Russell Nomer Platform
    `,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">🎰 LotteryPro VIP Code</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Russell Nomer Platform</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hello!</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Russell Nomer has generated a special VIP code for you:
        </p>
        
        <div style="background: #f8f9fa; border: 2px dashed #6c757d; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h2 style="color: #495057; margin: 0; font-family: monospace; font-size: 24px; letter-spacing: 2px;">
            ${vipCode}
          </h2>
        </div>
        
        <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Account Upgrade: ${targetTier.toUpperCase()} TIER</strong>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ Security Features:</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Account-specific email binding</li>
            <li>Expires: <strong>${expiresAt.toLocaleString()}</strong></li>
            <li>Google Authenticator TOTP security</li>
            <li>Cannot be hacked or reused</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://lotterypro.app/admin" 
             style="background: linear-gradient(135deg, #dc3545, #e91e63); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
            🔑 Redeem VIP Code Now
          </a>
        </div>
        
        <div style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
          <h3 style="color: #004085; margin-top: 0;">💎 Your New Benefits:</h3>
          <ul style="color: #004085; margin: 0; padding-left: 20px;">
            <li>Ad-free lottery experience</li>
            <li>Unlimited number generations</li>
            <li>Premium analysis features</li>
            <li>Priority customer support</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 30px;">
          Questions? Contact Russell directly!<br>
          <strong>The LotteryPro Team • Russell Nomer Platform</strong>
        </p>
      </div>
    </div>
    `,
  });
}

/**
 * Send welcome email to new user with VIP code and tier information
 */
export async function sendWelcomeEmailWithVipCode(
  userEmail: string,
  vipCode: string,
  tierLevel: string,
  userName: string = 'New User'
): Promise<boolean> {
  try {
    const result = await sendMail({
      to: userEmail,
      subject: "Welcome to Russell Nomer's LotteryPro Platform!",
      text: `
Welcome to LotteryPro, ${userName}!

Russell Nomer has set up a ${tierLevel.toUpperCase()} tier account for you.

Your VIP Code: ${vipCode}

Use this code at https://lotterypro.app/admin to activate your account upgrade.

Welcome aboard!
The LotteryPro Team
      `,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to LotteryPro!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Russell Nomer Platform</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Hi ${userName}! 👋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Russell Nomer has set up a <strong>${tierLevel.toUpperCase()} tier</strong> account for you on LotteryPro.
          </p>
          <div style="background: #f8f9fa; border: 2px dashed #6c757d; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="color: #555; margin: 0 0 8px 0; font-size: 14px;">Your VIP Code:</p>
            <h2 style="color: #495057; margin: 0; font-family: monospace; font-size: 24px; letter-spacing: 2px;">${vipCode}</h2>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://lotterypro.app" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              🎰 Get Started on LotteryPro
            </a>
          </div>
          <p style="font-size: 14px; color: #6c757d; text-align: center;">
            <strong>The LotteryPro Team • Russell Nomer Platform</strong>
          </p>
        </div>
      </div>
      `,
    });
    return result.success;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * DRAW DAY REMINDER SYSTEM
 */

interface DrawReminderData {
  to: string;
  emailType: 'draw_reminder' | 'weekly_digest' | 'promotional' | 'welcome';
  game?: 'powerball' | 'megamillions';
  userId?: string;
  ticketId?: string;
}

// Generate draw day reminder HTML
export function generateDrawDayReminderHTML(
  game: 'powerball' | 'megamillions',
  userEmail: string
): string {
  const gameConfig = {
    powerball: {
      name: 'Powerball',
      color: '#E53E3E',
      icon: '⚡',
      drawTime: '10:59 PM ET',
    },
    megamillions: {
      name: 'MegaMillions',
      color: '#3182CE',
      icon: '💎',
      drawTime: '11:00 PM ET',
    }
  }[game];

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #F7FAFC; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">${gameConfig.icon} ${gameConfig.name} Draw Tonight!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Draw Time: ${gameConfig.drawTime}</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2D3748; margin: 0 0 15px 0;">Hey there, Lucky Player! 🍀</h2>
          <p style="color: #4A5568; font-size: 16px; line-height: 1.6;">
            Tonight's the night! The ${gameConfig.name} draw is happening at <strong>${gameConfig.drawTime}</strong>.
          </p>

          <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin-top: 20px;">
            <strong>Don't forget to get your tickets!</strong> Time is running out.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://www.jackpocket.com/?utm_source=lotterypro&utm_medium=email&utm_campaign=draw_reminder" 
               style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
              🎫 Buy Tickets on Jackpocket
            </a>
          </div>

          <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
            Or generate fresh numbers on <a href="https://lotterypro.app" style="color: ${gameConfig.color}; text-decoration: none; font-weight: bold;">LotteryPro.app</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #F7FAFC; padding: 30px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
            <strong>Russell Nomer's LotteryPro</strong><br>
            Educational Lottery Analysis Platform
          </p>
          <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
            <a href="https://lotterypro.app/unsubscribe?email=${encodeURIComponent(userEmail)}" style="color: #A0AEC0; text-decoration: underline;">Unsubscribe</a> | 
            <a href="https://lotterypro.app/preferences?email=${encodeURIComponent(userEmail)}" style="color: #A0AEC0; text-decoration: underline;">Email Preferences</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

// Send a draw reminder email
export async function sendDrawReminderEmail(data: DrawReminderData): Promise<boolean> {
  try {
    if (!data.game) {
      console.error('Game is required for draw reminder');
      return false;
    }

    const subject = `🎰 ${data.game === 'powerball' ? 'Powerball' : 'MegaMillions'} Draw Tonight - Don't Miss Out!`;
    const htmlContent = generateDrawDayReminderHTML(data.game, data.to);

    // Log email attempt
    await db.insert(emailSendLog).values({
      userId: data.userId || null,
      email: data.to,
      emailType: data.emailType,
      game: data.game,
      ticketId: data.ticketId || null,
      status: 'pending',
    });

    // Route through central sendMail (Resend-first, Gmail fallback)
    const text = `${data.game === 'powerball' ? 'Powerball' : 'MegaMillions'} draw is today! Log in to LotteryPro to check your numbers: https://lotterypro.app`;
    try {
      await sendMail({ to: data.to, subject, text, html: htmlContent });
    } catch (err: any) {
      console.error('❌ Email send failed:', err);
      await db.update(emailSendLog)
        .set({ status: 'failed', errorMessage: err.message })
        .where(eq(emailSendLog.email, data.to));
      return false;
    }

    await db.update(emailSendLog)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(emailSendLog.email, data.to));

    console.log('✅ Draw reminder sent:', data.to, data.game);
    return true;

  } catch (error: any) {
    console.error('❌ Email send failed:', error);
    await db.update(emailSendLog)
      .set({ status: 'failed', errorMessage: error.message })
      .where(eq(emailSendLog.email, data.to));
    return false;
  }
}

// Get draw schedule
export function getDrawDays(): { powerball: string[], megamillions: string[] } {
  return {
    powerball: ['Monday', 'Wednesday', 'Saturday'],
    megamillions: ['Tuesday', 'Friday']
  };
}

// Check if today is a draw day
export function isDrawDay(game: 'powerball' | 'megamillions'): boolean {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const schedule = getDrawDays();
  return schedule[game].includes(today);
}

// Send draw reminders to all subscribers
export async function sendAllDrawReminders(game: 'powerball' | 'megamillions'): Promise<number> {
  try {
    const field = game === 'powerball' ? 'powerballReminders' : 'megamillionsReminders';
    
    const subscribers = await db.select()
      .from(emailPreferences)
      .where(eq(emailPreferences[field], 1));

    let sentCount = 0;
    
    for (const subscriber of subscribers) {
      const success = await sendDrawReminderEmail({
        to: subscriber.email,
        emailType: 'draw_reminder',
        game,
        userId: subscriber.userId || undefined,
      });

      if (success) {
        sentCount++;
        await db.update(emailPreferences)
          .set({ lastEmailSent: new Date() })
          .where(eq(emailPreferences.id, subscriber.id));
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📧 Draw reminders sent: ${sentCount}/${subscribers.length} for ${game}`);
    return sentCount;

  } catch (error) {
    console.error('❌ Error sending draw reminders:', error);
    return 0;
  }
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetToken: string
): Promise<{ success: boolean; message: string }> {
  const resetUrl = `https://lotterypro.app/auth?reset=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">🎰 LotteryPro Password Reset</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Russell Nomer Platform</p>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; margin-top: 2px;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p style="color: #555;">Someone requested a password reset for your LotteryPro account. If this was you, click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Reset My Password</a>
        </div>
        <p style="color: #888; font-size: 14px;">This link expires in <strong>30 minutes</strong>.</p>
        <p style="color: #888; font-size: 14px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">LotteryPro · Educational lottery analysis platform · <a href="https://lotterypro.app" style="color: #667eea;">lotterypro.app</a></p>
      </div>
    </div>
  `;

  const text = `LotteryPro Password Reset\n\nClick the link below to reset your password (expires in 30 minutes):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;

  // Route through central sendMail (Resend-first, Gmail fallback)
  try {
    const result = await sendMail({ to: recipientEmail, subject: '🔐 LotteryPro Password Reset', html, text });
    console.log(`✅ Password reset email sent to ${recipientEmail}`);
    return result;
  } catch (error: any) {
    console.error('❌ Failed to send password reset email:', error?.message || error);
    return { success: false, message: 'Failed to send email' };
  }
}
