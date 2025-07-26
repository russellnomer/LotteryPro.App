import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RussellMusicPlayer from "@/components/RussellMusicPlayer";
import RussellBiography from "@/components/RussellBiography";
import BookRecommendations from "@/components/BookRecommendations";
import FanLoyaltyContest from "@/components/FanLoyaltyContest";
import VipCodeManager from "@/components/VipCodeManager";
import AstrologicalFeatures from "@/components/AstrologicalFeatures";
import AdSpace from "@/components/AdSpace";
import { Music, Heart, Star, Crown, DollarSign, Youtube, ExternalLink } from "lucide-react";

export default function MusicHome() {
  const [userTier, setUserTier] = useState<'free' | 'basic' | 'pro' | 'premium'>('free');
  const [userEmail] = useState<string>("demo@example.com");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-primary flex items-center gap-2">
                🎵 Russell Nomer Music
              </div>
              <Badge variant="outline" className="text-xs">
                ASCAP Member Platform
              </Badge>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-primary transition-colors">AI Lottery Pro</a>
              <a href="/music" className="text-primary font-semibold transition-colors">Russell's Music</a>
              <a href="/books" className="text-gray-600 hover:text-primary transition-colors">Books</a>
              <a href="/fan-contest" className="text-gray-600 hover:text-primary transition-colors">Fan Contest</a>
              <a href="/support" className="text-gray-600 hover:text-primary transition-colors">Support Russell</a>
              
              {/* Demo User Tier Switcher */}
              <select 
                value={userTier} 
                onChange={(e) => setUserTier(e.target.value as any)}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Russell Nomer Showcase */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              🎵 Russell Nomer Music Platform
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-6">
              Authentic ASCAP Member Music Catalog • Books • Fan Community
            </p>
            <div className="flex justify-center gap-4 mb-6">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Youtube className="h-4 w-4 mr-2" />
                438 Songs Available
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Heart className="h-4 w-4 mr-2" />
                ASCAP Professional
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                Authentic Catalog
              </Badge>
            </div>
            
            {/* Streaming Support Education */}
            <Alert className="bg-yellow-500/20 border-yellow-400/30 text-yellow-100 max-w-4xl mx-auto">
              <DollarSign className="h-5 w-5" />
              <AlertDescription className="text-lg">
                <strong>💰 Support Russell's Journey:</strong> Apple Music pays $0.00735/stream vs Spotify's $0.004. 
                Russell has been out of work for 2 years due to cervical spinal fusion surgery. 
                <strong className="text-yellow-200"> Stream, share, and buy books to truly help!</strong>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Free Tier Advertisement */}
        {userTier === 'free' && (
          <div className="mb-6 flex justify-center">
            <AdSpace size="leaderboard" position="Header" className="max-w-full" />
          </div>
        )}

        {/* Platform Features Tabs */}
        <Tabs defaultValue="music" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="lottery" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Lottery Pro
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="contest" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Fan Contest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {/* Russell's Authentic Music Player */}
                <div className="mb-8">
                  <RussellMusicPlayer />
                </div>
                {/* Russell's Story & Biography */}
                <div className="mb-8">
                  <RussellBiography />
                </div>
              </div>
              <div className="space-y-6">
                <VipCodeManager userEmail={userEmail} />
                {userTier === 'free' && (
                  <div className="flex justify-center">
                    <AdSpace size="square" position="Sidebar Mid" />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lottery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-primary" />
                  Russell's LotteryPro - Statistical Analysis Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-lg text-gray-600 mb-6">
                    Access Russell's advanced lottery number generation system using statistical analysis, 
                    frequency patterns, and wheel combinations for Powerball and MegaMillions.
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => window.location.href = '/'}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Launch AI LotteryPro
                  </Button>
                  <div className="mt-4 text-sm text-gray-500">
                    Advanced analytics • Historical data • Multiple generation methods
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books">
            <BookRecommendations />
          </TabsContent>

          <TabsContent value="contest">
            <FanLoyaltyContest />
          </TabsContent>
        </Tabs>

        {/* Main Content Grid for Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Cross-platform features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Access Cards */}
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-800">
                    <Music className="h-5 w-5 mr-2" />
                    Music Streaming
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-purple-700 mb-3">
                    438 authentic Russell Nomer songs with direct YouTube integration. 
                    Support Russell's recovery through streaming royalties.
                  </p>
                  <Button size="sm" variant="outline" className="w-full border-purple-600 text-purple-600">
                    <Music className="h-4 w-4 mr-2" />
                    Browse Music Catalog
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <Star className="h-5 w-5 mr-2" />
                    Lottery Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-orange-700 mb-3">
                    Statistical analysis for Powerball and MegaMillions using frequency patterns, 
                    hot/cold numbers, and wheel systems.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full border-orange-600 text-orange-600"
                    onClick={() => window.location.href = '/'}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Generate Numbers
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* VIP Code Manager */}
            <VipCodeManager userEmail={userEmail} />

            {/* Mid-sidebar Advertisement for Free Users */}
            {userTier === 'free' && (
              <div className="flex justify-center">
                <AdSpace size="square" position="Sidebar Mid" />
              </div>
            )}

            {/* Fan Loyalty Contest */}
            <FanLoyaltyContest compact={true} />

            {/* Astrological Features */}
            <AstrologicalFeatures compact={true} />

            {/* Support Russell Section */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Support Russell's Recovery
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p className="text-orange-700">
                  Russell has been out of work for 2 years due to cervical spinal fusion surgery and lives with constant pain. 
                  Your support helps him continue creating music and content during this challenging time.
                </p>
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => window.open('https://www.youtube.com/channel/UCAiOa4F7HAyxgHaDlRPw6vA', '_blank')}
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    Subscribe on YouTube
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full border-orange-600 text-orange-600"
                    onClick={() => window.open('https://open.spotify.com/artist/russell-nomer', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Follow on Spotify
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Streaming Stats Education */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Streaming Revenue Reality
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-green-700">
                <div className="flex justify-between">
                  <span>Apple Music:</span>
                  <span className="font-semibold">$0.00735/stream</span>
                </div>
                <div className="flex justify-between">
                  <span>Spotify:</span>
                  <span className="font-semibold">$0.004/stream</span>
                </div>
                <div className="flex justify-between">
                  <span>YouTube:</span>
                  <span className="font-semibold">$0.0007/stream</span>
                </div>
                <p className="text-xs mt-3 bg-green-100 p-2 rounded">
                  It takes 1,000 streams to earn $4-7. Book purchases and direct support make a real difference!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Advertisement for Free Users */}
        {userTier === 'free' && (
          <div className="mt-8 mb-6 flex justify-center">
            <AdSpace size="banner" position="Footer" className="max-w-full" />
          </div>
        )}

        {/* Footer - Russell Nomer Branding */}
        <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
          <div className="text-gray-600 text-sm">
            <p className="mb-2">
              © 2025 Russell Nomer Music Platform • ASCAP Member • 
              Authentic Music Catalog with AI-Powered Fan Engagement
            </p>
            <p className="text-xs">
              Supporting independent music during Russell's recovery from cervical spinal fusion surgery.
              Every stream, share, and book purchase helps sustain his creative journey.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}