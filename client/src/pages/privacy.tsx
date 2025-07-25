import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">
                <i className="fas fa-chart-line mr-2"></i>LotteryPro
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-primary transition-colors">Dashboard</a>
              <a href="/performance" className="text-gray-600 hover:text-primary transition-colors">Performance</a>
              <a href="/subscription" className="text-gray-600 hover:text-primary transition-colors">Subscribe</a>
              <a href="/privacy" className="text-primary font-semibold transition-colors">Privacy</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-gray-600">Last updated: January 2025</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h2>Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, 
              use our lottery analysis services, or communicate with us.
            </p>

            <h2>How We Use Your Information</h2>
            <ul>
              <li>To provide and maintain our lottery analysis services</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send you technical notices and support messages</li>
              <li>To analyze usage patterns and improve our services</li>
            </ul>

            <h2>Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties 
              without your consent, except as described in this policy.
            </p>

            <h2>Advertising</h2>
            <p>
              We use Google AdSense to display advertisements. Google may use cookies to serve ads 
              based on your visits to our site and other sites on the Internet. You can opt out of 
              personalized advertising by visiting Google's Ads Settings.
            </p>

            <h2>Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2>Cookies</h2>
            <p>
              We use cookies to enhance your experience, analyze site usage, and assist in our 
              marketing efforts. You can control cookies through your browser settings.
            </p>

            <h2>Children's Privacy</h2>
            <p>
              Our service is not intended for children under 18. We do not knowingly collect 
              personal information from children under 18.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any 
              significant changes by posting the new policy on this page.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact us at 
              privacy@lotterypro.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}