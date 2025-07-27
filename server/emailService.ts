// Simple email service for VIP code delivery
// Note: For production, integrate with SendGrid or similar service

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendVipCodeEmail(
  recipientEmail: string, 
  vipCode: string, 
  targetTier: string,
  expiresAt: Date
): Promise<{ success: boolean; message: string }> {
  
  const emailData: EmailData = {
    to: recipientEmail,
    subject: "🎰 Your LotteryPro VIP Code - Russell Nomer Platform",
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
Visit: https://your-lottery-app.replit.app/admin
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
          <a href="https://your-lottery-app.replit.app/admin" 
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
    `
  };

  // For development, just log the email content
  console.log('\n🔥 VIP CODE EMAIL SENT 🔥');
  console.log('=================================');
  console.log(`To: ${emailData.to}`);
  console.log(`Subject: ${emailData.subject}`);
  console.log('\nVIP CODE CONTENT:');
  console.log('=================================');
  console.log(emailData.text);
  console.log('=================================\n');

  // In production, integrate with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(emailData);

  return {
    success: true,
    message: `VIP code email sent to ${recipientEmail} (logged to console in development)`
  };
}