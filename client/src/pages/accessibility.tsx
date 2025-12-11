import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Accessibility, Eye, Keyboard, Volume2, CheckCircle } from "lucide-react";

export default function AccessibilityStatement() {
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
              <Accessibility className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-3xl" data-testid="text-page-title">Accessibility Statement</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">Effective Date: January 2025 | WCAG 2.1 AA</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none py-8 leading-relaxed">
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <p className="text-blue-800 dark:text-blue-300 text-sm m-0">
                <strong>Our Commitment:</strong> LotteryPro is committed to ensuring digital accessibility for people with disabilities. 
                We continually improve the user experience for everyone and apply the relevant accessibility standards.
              </p>
            </div>

            <h2 className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Conformance Status
            </h2>
            <p>
              LotteryPro strives to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. 
              These guidelines explain how to make web content more accessible for people with disabilities.
            </p>

            <h2 className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Accessibility Features
            </h2>
            <ul>
              <li><strong>Text Alternatives:</strong> All meaningful images have descriptive alt text</li>
              <li><strong>Color Contrast:</strong> Minimum 4.5:1 contrast ratio for normal text</li>
              <li><strong>Resizable Text:</strong> Content remains readable at 200% zoom</li>
              <li><strong>Semantic Structure:</strong> Proper heading hierarchy (H1-H3) for navigation</li>
              <li><strong>Form Labels:</strong> All form inputs have associated labels</li>
              <li><strong>Error Identification:</strong> Clear error messages with suggestions</li>
            </ul>

            <h2 className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Navigation
            </h2>
            <ul>
              <li>All interactive elements are accessible via keyboard</li>
              <li>Skip links available to bypass navigation</li>
              <li>Focus indicators visible on all interactive elements</li>
              <li>Logical tab order throughout the application</li>
              <li>No keyboard traps</li>
            </ul>

            <h2 className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Assistive Technology Support
            </h2>
            <p>LotteryPro is designed to be compatible with:</p>
            <ul>
              <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Alternative input devices</li>
            </ul>

            <h2>Known Limitations</h2>
            <p>
              While we strive for full accessibility, some areas may have limitations:
            </p>
            <ul>
              <li>Third-party content (advertisements, embedded videos) may not be fully accessible</li>
              <li>Some complex data visualizations may require alternative text descriptions</li>
              <li>PDF documents may have varying levels of accessibility</li>
            </ul>

            <h2>Feedback and Contact</h2>
            <p>
              We welcome your feedback on the accessibility of LotteryPro. If you encounter accessibility barriers:
            </p>
            <ul>
              <li>Email: accessibility@lotterypro.com</li>
              <li>Support: <Link href="/support"><a className="text-primary">Submit a Support Ticket</a></Link></li>
            </ul>
            <p>
              We try to respond to accessibility feedback within 5 business days.
            </p>

            <h2>Assessment Methods</h2>
            <p>LotteryPro assesses accessibility through:</p>
            <ul>
              <li>Self-evaluation using WCAG 2.1 guidelines</li>
              <li>Automated testing with accessibility tools (WAVE, axe)</li>
              <li>Manual keyboard and screen reader testing</li>
              <li>User feedback integration</li>
            </ul>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This statement was last updated on January 2025. We regularly review and update our accessibility practices.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
