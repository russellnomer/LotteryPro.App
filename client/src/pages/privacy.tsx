import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Shield, Eye, Database, Cookie, UserCheck, Bell, Trash2 } from "lucide-react";
import DSARForm from "@/components/DSARForm";
import SEOHead from "@/components/SEOHead";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <SEOHead title="Privacy Policy" description="LotteryPro privacy policy. GDPR and CCPA compliant data handling practices." path="/privacy" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-8 block" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-3xl" data-testid="text-page-title">Privacy Policy</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">Effective Date: February 2026 | Version 1.1</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none py-8 leading-relaxed">
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <p className="text-blue-800 dark:text-blue-300 text-sm m-0">
                <strong>Your Privacy Matters:</strong> This policy explains how LotteryPro collects, uses, 
                and protects your personal information. By using our services, you consent to the practices 
                described herein.
              </p>
            </div>

            <h2 className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              1. Information We Collect
            </h2>
            
            <h3>1.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Email address, password (encrypted), subscription preferences</li>
              <li><strong>Profile Data:</strong> Name, preferences, numerology inputs (birth dates, significant numbers)</li>
              <li><strong>Payment Information:</strong> Processed securely by Stripe; we do not store credit card numbers</li>
              <li><strong>Support Requests:</strong> Information you provide when contacting customer support</li>
              <li><strong>Communications:</strong> Emails, feedback, and survey responses</li>
            </ul>

            <h3>1.2 Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, click patterns</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
              <li><strong>Log Data:</strong> IP addresses, access times, error logs</li>
              <li><strong>Location Data:</strong> General geographic location based on IP address</li>
              <li><strong>Cookies and Tracking:</strong> As described in our Cookie Policy below</li>
            </ul>

            <h3>1.3 Information from Third Parties</h3>
            <ul>
              <li>Payment verification data from Stripe</li>
              <li>Social login data if you choose to connect social accounts</li>
              <li>Publicly available lottery results from official sources</li>
            </ul>

            <h2 className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              2. How We Use Your Information
            </h2>
            <p>We use collected information for the following purposes:</p>
            
            <h3>2.1 Service Operations</h3>
            <ul>
              <li>Providing and maintaining the LotteryPro platform</li>
              <li>Processing subscriptions and payments</li>
              <li>Personalizing your experience and number generation preferences</li>
              <li>Sending transactional emails (confirmations, receipts, updates)</li>
              <li>Providing customer support</li>
            </ul>

            <h3>2.2 Analytics and Improvement</h3>
            <ul>
              <li>Analyzing usage patterns to improve our services</li>
              <li>Developing new features based on user behavior</li>
              <li>Monitoring and preventing fraud or abuse</li>
              <li>Conducting research and statistical analysis</li>
            </ul>

            <h3>2.3 Marketing and Communications</h3>
            <ul>
              <li>Sending promotional emails (with your consent)</li>
              <li>Displaying relevant advertisements through Google AdSense</li>
              <li>Notifying you about new features, jackpot alerts, and special offers</li>
            </ul>

            <h2 className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              3. Information Sharing and Disclosure
            </h2>
            
            <h3>3.1 Service Providers</h3>
            <p>We share data with trusted third parties who assist in operating our service:</p>
            <ul>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>SendGrid:</strong> Email communications</li>
              <li><strong>Google Analytics:</strong> Usage analytics</li>
              <li><strong>Google AdSense:</strong> Advertising (for free tier users)</li>
              <li><strong>OpenAI:</strong> AI-powered features and support triage</li>
            </ul>

            <h3>3.2 Legal Requirements</h3>
            <p>We may disclose information when required by law, such as:</p>
            <ul>
              <li>Responding to valid legal requests (subpoenas, court orders)</li>
              <li>Protecting our rights, property, or safety</li>
              <li>Preventing fraud or illegal activities</li>
            </ul>

            <h3>3.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be 
              transferred as part of the business transaction. We will notify you of any such change.
            </p>

            <h3>3.4 Aggregated and De-identified Data</h3>
            <p>
              We may share aggregated, anonymized data that cannot identify you personally for 
              research, marketing, and analytics purposes.
            </p>

            <h2 className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              4. Cookies and Tracking Technologies
            </h2>
            <p>We use cookies and similar technologies for:</p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for site functionality (authentication, security)</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
              <li><strong>Advertising Cookies:</strong> Used by Google AdSense for personalized ads</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Blocking essential cookies may 
              affect site functionality. You can opt out of personalized advertising through 
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer"> Google's Ads Settings</a>.
            </p>

            <h2 className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              5. Data Security
            </h2>
            <p>We implement industry-standard security measures including:</p>
            <ul>
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure password hashing (bcrypt with salt)</li>
              <li>Multi-factor authentication (MFA) for all subscriber accounts</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and employee training</li>
              <li>Rate limiting and DDoS protection</li>
            </ul>
            <p>
              While we strive to protect your data, no method of transmission over the Internet 
              is 100% secure. We cannot guarantee absolute security.
            </p>

            <h2>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed 
              to provide services. After account deletion:
            </p>
            <ul>
              <li>Account data is deleted within 30 days</li>
              <li>Anonymized analytics data may be retained indefinitely</li>
              <li>Legal compliance records may be retained as required by law</li>
              <li>Backup copies may persist for up to 90 days</li>
            </ul>

            <h2 className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              7. Your Rights and Choices
            </h2>
            
            <h3>7.1 Access and Portability</h3>
            <p>You have the right to request a copy of your personal data in a portable format.</p>

            <h3>7.2 Correction</h3>
            <p>You can update your account information at any time through your account settings.</p>

            <h3>7.3 Deletion</h3>
            <p>
              You may request deletion of your account and personal data by contacting support. 
              Some data may be retained for legal compliance.
            </p>

            <h3>7.4 Marketing Opt-Out</h3>
            <p>
              You can unsubscribe from marketing emails at any time using the link in any email 
              or through your account preferences.
            </p>

            <h3>7.5 Do Not Track</h3>
            <p>
              We currently do not respond to "Do Not Track" browser signals, as there is no 
              industry-standard interpretation.
            </p>

            <h2>8. California Privacy Rights (CCPA)</h2>
            <p>California residents have additional rights under the CCPA:</p>
            <ul>
              <li><strong>Right to Know:</strong> Categories and specific pieces of personal information collected</li>
              <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of the "sale" of personal information</li>
              <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising these rights</li>
            </ul>
            <p>
              To exercise these rights, contact us at legal@russellnomer.com or submit a 
              <Link href="/support"><a className="text-primary"> support request</a></Link>.
            </p>

            <h2>9. European Privacy Rights (GDPR)</h2>
            <p>If you are in the European Economic Area (EEA), you have rights including:</p>
            <ul>
              <li>Access to your personal data</li>
              <li>Rectification of inaccurate data</li>
              <li>Erasure ("right to be forgotten")</li>
              <li>Restriction of processing</li>
              <li>Data portability</li>
              <li>Object to processing</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p>
              Our legal basis for processing includes: consent, contract performance, legitimate 
              interests, and legal obligations.
            </p>

            <h2>10. Children's Privacy</h2>
            <p>
              LotteryPro is not intended for users under 18 years of age. We do not knowingly 
              collect personal information from children. If we become aware that we have collected 
              data from a child under 18, we will delete it promptly.
            </p>

            <h2>11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We use appropriate safeguards such as Standard Contractual Clauses to protect your data 
              during international transfers.
            </p>

            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Material changes will be notified via 
              email or prominent notice on our website. The "Effective Date" at the top indicates 
              when the policy was last revised.
            </p>

            <h2 className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              13. Contact Us
            </h2>
            <p>For privacy-related questions or to exercise your rights, contact us:</p>
            <ul>
              <li><strong>Email:</strong> legal@russellnomer.com</li>
              <li><strong>Website:</strong> <a href="https://lotterypro.app" className="text-primary">https://lotterypro.app</a></li>
              <li><strong>Support:</strong> <Link href="/support"><a className="text-primary">Submit a Support Ticket</a></Link></li>
            </ul>
            
            <h2 id="dsar" className="flex items-center gap-2 pt-4">
              <Database className="w-5 h-5" />
              14. Submit a Data Request (DSAR)
            </h2>
            <p>
              Use the form below to exercise your CCPA/GDPR rights. We will verify your identity 
              and respond within 30 days as required by law.
            </p>
            
            <div className="my-6 not-prose">
              <DSARForm />
            </div>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                By using LotteryPro, you acknowledge that you have read and understood this Privacy Policy 
                and consent to the collection and use of your information as described.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
