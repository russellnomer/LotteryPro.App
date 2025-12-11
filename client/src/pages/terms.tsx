import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Shield, FileText, Scale, AlertTriangle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/">
          <a className="inline-flex items-center text-primary hover:text-primary/80 mb-8" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </a>
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-3xl" data-testid="text-page-title">Terms of Service</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">Effective Date: January 2025 | Version 1.0</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none py-8 leading-relaxed">
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-400 m-0">Important Notice</h4>
                  <p className="text-amber-700 dark:text-amber-300 text-sm m-0 mt-1">
                    By using LotteryPro, you agree to these Terms of Service. If you do not agree, please do not use our services.
                    This platform is for educational and entertainment purposes only.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using LotteryPro ("the Service"), you agree to be bound by these Terms of Service 
              ("Terms"). These Terms constitute a legally binding agreement between you and LotteryPro 
              ("we," "us," or "our"). Your continued use of the Service constitutes acceptance of any 
              modifications to these Terms.
            </p>

            <h2 className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              2. Educational and Entertainment Purpose
            </h2>
            <p>
              <strong>LotteryPro is strictly an educational and entertainment platform.</strong> We provide 
              statistical analysis, historical data visualization, and number generation tools for 
              educational study of lottery patterns. Our services:
            </p>
            <ul>
              <li><strong>DO NOT</strong> guarantee any lottery winnings or improved odds</li>
              <li><strong>DO NOT</strong> constitute gambling, wagering, or betting services</li>
              <li><strong>DO NOT</strong> provide financial or investment advice</li>
              <li><strong>ARE NOT</strong> affiliated with any state lottery commission or gaming authority</li>
            </ul>
            <p>
              Any number combinations generated are for educational purposes only. Past lottery results 
              do not predict future outcomes. Each lottery drawing is an independent random event.
            </p>

            <h2>3. User Eligibility</h2>
            <p>
              You must be at least 18 years old to use this Service. By using LotteryPro, you represent 
              and warrant that you meet this age requirement. We reserve the right to terminate accounts 
              of users who do not meet eligibility requirements.
            </p>
            
            <h3>3.1 Contest Eligibility</h3>
            <ul>
              <li><strong>Location:</strong> Contests are open to legal residents of the United States only</li>
              <li><strong>Age:</strong> Participants must be 18 years or older</li>
              <li><strong>Account:</strong> One entry per person/household for any contest</li>
              <li><strong>No Real Winnings:</strong> All contests are for entertainment purposes only and do not result in actual lottery winnings</li>
            </ul>

            <h2>4. Account Registration and Security</h2>
            <p>
              When you create an account, you agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Complete multi-factor authentication (MFA) setup as required</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h2>5. Subscription and Payments</h2>
            <p>
              Paid subscription features are available at various tier levels. By subscribing, you agree to:
            </p>
            <ul>
              <li>Pay all applicable fees as described at the time of purchase</li>
              <li>Provide valid payment information</li>
              <li>Automatic renewal unless cancelled before the billing cycle</li>
              <li>No refunds for partial subscription periods unless required by law</li>
            </ul>
            <p>
              We reserve the right to modify pricing with 30 days' notice to existing subscribers.
            </p>
            
            <h3>5.1 VIP Code Rules</h3>
            <ul>
              <li><strong>Personal Use:</strong> VIP codes are non-transferable and for personal use only</li>
              <li><strong>No Resale:</strong> Selling or trading VIP codes is strictly prohibited</li>
              <li><strong>Limit:</strong> Maximum one VIP code redemption per user per day</li>
              <li><strong>Expiration:</strong> VIP codes expire 5 minutes after generation for security</li>
              <li><strong>Revocation:</strong> We reserve the right to revoke VIP access for violations</li>
            </ul>

            <h2>6. User Conduct</h2>
            <p>
              You agree NOT to:
            </p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Scrape, harvest, or collect data without authorization</li>
              <li>Resell, redistribute, or commercially exploit the Service without permission</li>
              <li>Impersonate any person or entity</li>
              <li>Use automated systems (bots, scripts) without authorization</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of LotteryPro—including but not limited to text, 
              graphics, logos, algorithms, software, and data compilations—are owned by or licensed to us 
              and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable license to access and use the 
              Service for personal, non-commercial purposes only.
            </p>

            <h2>8. User-Generated Content</h2>
            <p>
              By submitting content (including support tickets, feedback, or community posts), you grant 
              us a worldwide, royalty-free, perpetual, irrevocable license to use, modify, reproduce, 
              distribute, and display such content in connection with operating and improving our Service.
            </p>

            <h2>9. Third-Party Services</h2>
            <p>
              Our Service may contain links to or integrations with third-party services (e.g., Stripe 
              for payments, Jackpocket for ticket purchases). We are not responsible for the content, 
              terms, or practices of these third parties. Your use of such services is at your own risk.
            </p>
            
            <h3>9.1 Affiliate Disclosures</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-amber-500">
              <p className="text-sm mb-2">
                <strong>Amazon Associates:</strong> As an Amazon Associate, I earn from qualifying purchases. 
                Book links on this site may be affiliate links.
              </p>
              <p className="text-sm mb-2">
                <strong>Jackpocket:</strong> We may receive compensation when you sign up for Jackpocket 
                through our referral links. This does not affect your purchase price.
              </p>
              <p className="text-sm">
                <strong>Casino Offers:</strong> Any casino-related links are for informational/educational 
                purposes only and are not affiliate partnerships unless explicitly disclosed.
              </p>
            </div>
            
            <h3>9.2 Music and Media</h3>
            <p>
              All embedded YouTube videos and music content are subject to YouTube's terms of service. 
              Music by Russell Nomer is used with permission. Any third-party content is used under 
              fair use provisions for educational and commentary purposes.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-primary">
              <p className="font-semibold mb-2">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE"</p>
              <p className="text-sm">
                WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND 
                NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, 
                OR ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED.
              </p>
            </div>

            <h2>11. Limitation of Liability</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-red-500">
              <p className="text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOTTERYPRO AND ITS AFFILIATES, OFFICERS, 
                DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="text-sm mt-2">
                <li>Loss of profits, revenue, data, or use</li>
                <li>Lottery losses or failure to win</li>
                <li>Reliance on any analysis or number combinations</li>
                <li>Service interruptions or errors</li>
              </ul>
              <p className="text-sm mt-2">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS 
                PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
              </p>
            </div>

            <h2>12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless LotteryPro and its affiliates from any 
              claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising 
              from your use of the Service, violation of these Terms, or infringement of any third-party 
              rights.
            </p>

            <h2>13. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, 
              with or without cause, with or without notice. Upon termination:
            </p>
            <ul>
              <li>Your right to use the Service immediately ceases</li>
              <li>We may delete your account and data</li>
              <li>Provisions that by their nature should survive will remain in effect</li>
            </ul>

            <h2>14. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms or your use of the Service shall be resolved through 
              binding arbitration in accordance with the American Arbitration Association's rules. 
              You agree to waive any right to participate in class action lawsuits or class-wide 
              arbitration.
            </p>
            <p>
              For claims under $10,000, either party may choose small claims court instead of arbitration.
            </p>

            <h2>15. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the 
              State of Delaware, without regard to its conflict of law principles.
            </p>

            <h2>16. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be notified 
              via email or prominent notice on the Service. Continued use after changes constitutes 
              acceptance of the modified Terms.
            </p>

            <h2>17. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions 
              will continue in full force and effect.
            </p>

            <h2>18. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy and any additional terms for specific 
              features, constitute the entire agreement between you and LotteryPro regarding the Service.
            </p>

            <h2>19. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us:
            </p>
            <ul>
              <li>Email: legal@russellnomer.com</li>
              <li>Support: <Link href="/support"><a className="text-primary">Submit a Support Ticket</a></Link></li>
            </ul>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                By using LotteryPro, you acknowledge that you have read, understood, and agree to be 
                bound by these Terms of Service.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
