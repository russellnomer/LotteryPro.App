import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Music, Book, TrendingUp, Users, Youtube } from "lucide-react";

export default function RussellBiography() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-6 w-6" />
          About Russell Nomer - Creator & ASCAP Member
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Personal Journey Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Personal Journey & Resilience
          </h3>
          <div className="space-y-4 text-gray-700">
            <p>
              Russell Nomer has faced extraordinary challenges over the past few years. Following two serious accidents that required cervical spinal fusion surgery, Russell now lives with constant pain while courageously rebuilding his life and career.
            </p>
            <p>
              The combination of chronic pain, extensive physical therapy, pain medication management, and the inability to work full-time in his chosen field has resulted in significant income loss. Despite these overwhelming challenges, Russell's determination to create and contribute remains unshaken.
            </p>
            <Alert className="bg-amber-50 border-amber-300">
              <Heart className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>The Power of AI as a Creative Partner:</strong> Leveraging artificial intelligence has been a godsend for Russell, enabling him to pursue his creative passions and develop revenue streams while managing his physical limitations. This platform represents his commitment to giving back through entertainment and interests that bring joy to others.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Professional & Creative Identity */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Music className="h-5 w-5 text-purple-600" />
              ASCAP Music Professional
            </h3>
            <div className="space-y-2">
              <Badge variant="secondary" className="mr-2">ASCAP Member</Badge>
              <Badge variant="outline" className="mr-2">Performance Rights</Badge>
              <Badge variant="outline">Music Publishing</Badge>
            </div>
            <p className="text-sm text-gray-600">
              As an ASCAP (American Society of Composers, Authors and Publishers) member, Russell is actively pursuing music placement opportunities in television, film, and commercial productions. This platform helps connect his work with industry professionals including show runners, producers, and music supervisors.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Book className="h-5 w-5 text-green-600" />
              Gaming Strategy Author
            </h3>
            <div className="space-y-2">
              <Badge variant="secondary" className="mr-2">Published Author</Badge>
              <Badge variant="outline" className="mr-2">Gambling Strategy</Badge>
              <Badge variant="outline">Casino Expert</Badge>
            </div>
            <p className="text-sm text-gray-600">
              Russell has authored comprehensive guides on casino strategy, combining mathematical analysis with practical gambling wisdom. His books help players make informed decisions while enjoying casino games responsibly.
            </p>
          </div>
        </div>

        {/* Security & Privacy Commitment */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Security & Privacy First Community
          </h3>
          <div className="space-y-3 text-gray-700">
            <p>
              Under Russell's guidance, this platform adheres to all known security best practices and privacy standards. Every feature is designed with community safety in mind, ensuring users feel comfortable and protected while being part of our community.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-white rounded border">
                <Shield className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Security Hardened</p>
                <p className="text-xs text-gray-500">OWASP, NIST compliant</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Privacy Protected</p>
                <p className="text-xs text-gray-500">Your data stays safe</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <Heart className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Community Focused</p>
                <p className="text-xs text-gray-500">Built with care</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Stream Approach */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Supporting Russell's Recovery
          </h3>
          <p className="text-gray-700 mb-4">
            This platform represents Russell's innovative approach to rebuilding financial stability through multiple legitimate revenue streams while providing genuine value to the community:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-500" />
                <span>Music streaming royalties (ASCAP)</span>
              </li>
              <li className="flex items-center gap-2">
                <Book className="h-4 w-4 text-green-500" />
                <span>Strategy book sales (Amazon affiliate)</span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span>Premium subscription services</span>
              </li>
            </ul>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                <span>Responsible advertising partnerships</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Fan community engagement</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-500" />
                <span>ASCAP industry networking</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
          <p className="text-lg font-medium text-gray-800 mb-4">
            Your support helps Russell continue creating while managing chronic pain and rebuilding his career.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              onClick={() => window.open('https://youtube.com/@russellnomermusic?si=NdRd1TDGJfhSN1o0', '_blank')}
            >
              <Youtube className="h-4 w-4 mr-2" />
              🔔 Subscribe on YouTube - FREE!
            </Button>
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              <Book className="h-4 w-4 mr-2" />
              Buy Strategy Books
            </Button>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Heart className="h-4 w-4 mr-2" />
              Join Community
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}