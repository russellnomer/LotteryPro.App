import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import AdSpace from "@/components/AdSpace";
import { 
  Share2, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Clock, 
  Users, 
  Smartphone,
  Code2,
  Trophy,
  ArrowLeft,
  Copy,
  ExternalLink,
  Play,
  Heart,
  Zap,
  Star
} from "lucide-react";

export default function SocialMarketing() {
  const [copiedText, setCopiedText] = useState<string>("");
  const userTier = 'free'; // Default to free tier for ad display

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(""), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const replitLink = "https://replit.com/refer/RussellNomer";
  const jackpocketLink = "https://lottery.jackpocket.com/r/lotto/russellnomer/LOTTERY/US-NY";

  const socialPosts = {
    twitter: [
      {
        id: 1,
        type: "Jackpocket Focus",
        text: "Dreaming of millions? 💰 Powerball's at $350M, and you can play from your phone with Jackpocket! 🚀 Drawing's Saturday at 10:59 PM—don't miss out! Join now: " + jackpocketLink + ". Bonus: $3.5B+ of lottery sales help Colorado's outdoors! 🌄 #Lottery #Jackpocket #WinBig",
        audience: "Lottery players, dreamers",
        conversion: "High urgency"
      },
      {
        id: 2,
        type: "Replit Focus", 
        text: "Got a big idea? 💡 Turn it into reality with Replit! Code games, apps, or websites in minutes. Sign up via my link, upgrade to Replit Core, and I get $10 to keep creating! 🙌 Start now: " + replitLink + " #CodeWithReplit #VibeCoding #BuildSomething",
        audience: "Developers, creators",
        conversion: "Mutual benefit"
      },
      {
        id: 3,
        type: "Cross-Promotion",
        text: "Feeling lucky? 🍀 Play Powerball's $350M jackpot with Jackpocket: " + jackpocketLink + ". Want to code your own luck? Build epic projects on Replit and help me earn $10: " + replitLink + ". Act fast—lottery draws Saturday! #Jackpocket #Replit #DreamBig",
        audience: "Broad appeal",
        conversion: "Dual opportunity"
      }
    ],
    instagram: [
      {
        id: 1,
        type: "Jackpocket Visual",
        text: "Imagine winning $350M! 😍 With Jackpocket, you can play Powerball from anywhere, anytime. Drawing's THIS Saturday at 10:59 PM—don't wait! Plus, every ticket supports Colorado's parks and schools. 🌲📚 Tap the link to play: " + jackpocketLink + ". 💥 #Jackpocket #Powerball #WinBig",
        visual: "Phone showing Jackpocket app with $350M banner, Colorado backdrop",
        audience: "Visual storytelling"
      },
      {
        id: 2,
        type: "Replit Aesthetic",
        text: "Code your dreams into reality! 🚀 Replit makes it easy to build games, apps, or websites—no matter your skill level. Sign up with my link, upgrade to Replit Core, and I get $10 to keep coding. Let's create something epic together! 💻✨ Link: " + replitLink + " #Replit #VibeCoding #CodeYourFuture",
        visual: "Coder at laptop with neon lights, Vibe Coding aesthetic",
        audience: "Tech enthusiasts"
      },
      {
        id: 3,
        type: "Split Screen Power",
        text: "Big dreams need big moves! 💪 Play for a $350M Powerball jackpot with Jackpocket (drawing Saturday!) or code your next big idea with Replit. Use my links to play or build, and help me earn $10 with Replit Core. 🚀🍀 Links: " + jackpocketLink + " | " + replitLink + " #Jackpocket #Replit #DreamChaser",
        visual: "Split-screen: Jackpocket ticket + Replit coding project",
        audience: "Dreamers & builders"
      }
    ],
    tiktok: [
      {
        id: 1,
        type: "Jackpocket Energy",
        script: "Yo, $350 MILLION is up for grabs in Powerball! 😱 With Jackpocket, I can play right from my phone. Drawing's Saturday—don't sleep on this! Plus, it supports Colorado's parks and schools. 🌄 Tap the link to play! " + jackpocketLink,
        visual: "Upbeat music, phone showing app, Colorado nature cuts",
        hashtags: "#Jackpocket #Powerball #LotteryVibes #WinBig"
      },
      {
        id: 2,
        type: "Replit Vibe",
        script: "Wanna code something DOPE? 💻 Replit lets you build games, apps, or websites in minutes. Sign up with my link, upgrade to Replit Core, and I get $10 to keep creating. Let's vibe and code! Link: " + replitLink,
        visual: "Neon coding setup, quick cuts to finished projects, lo-fi beat",
        hashtags: "#Replit #VibeCoding #LearnToCode #TechLife"
      },
      {
        id: 3,
        type: "Double Hook",
        script: "Feeling lucky? 🍀 Play Powerball's $350M jackpot with Jackpocket—drawing's Saturday! Or code your own future with Replit. Use my links to play or build, and I get $10 when you upgrade to Replit Core. 🚀💰",
        visual: "Split-screen: Jackpocket swipe + Replit coding, fast music",
        hashtags: "#Jackpocket #Replit #DreamBig #LotteryAndCode"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-gray-600 hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lottery Pro
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-2xl font-bold text-primary">
                <Share2 className="h-6 w-6 mr-2 inline" />
                Social Marketing Hub
              </h1>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Conversion Optimized
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Ad Space for Free Users */}
      {userTier === 'free' && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <AdSpace size="leaderboard" position="Header" className="max-w-full" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">🚀 Maximum Conversion Social Copy</h2>
            <p className="text-purple-100 text-lg mb-6">
              Expert-crafted content leveraging gambling psychology and Vibe Coding appeal
            </p>
            <div className="flex justify-center gap-4 mb-6">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                High Conversion
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Target className="h-4 w-4 mr-2" />
                Psychology-Driven
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                Platform Optimized
              </Badge>
            </div>
          </div>
        </div>

        {/* Strategy Overview */}
        <Card className="mb-8 border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Marketing Strategy & Psychology
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-800 mb-3">🎯 Jackpocket Strategy</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>FOMO & Urgency:</strong> $350M deadline creates immediate action</li>
                  <li>• <strong>Social Proof:</strong> $3.5B+ supporting Colorado causes</li>
                  <li>• <strong>Convenience:</strong> Play from anywhere, anytime</li>
                  <li>• <strong>Emotional Hook:</strong> Life-changing money fantasy</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-800 mb-3">💻 Replit Strategy</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• <strong>Mutual Benefit:</strong> $10 credit feels like helping Russell</li>
                  <li>• <strong>Accessibility:</strong> Coding for all skill levels</li>
                  <li>• <strong>Vibe Appeal:</strong> Creative, tech-savvy community</li>
                  <li>• <strong>Dream Building:</strong> Turn ideas into reality</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <DollarSign className="h-5 w-5" />
                Jackpocket Referral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-3">New York Lottery via Jackpocket</p>
              <div className="bg-white p-3 rounded border border-green-200 mb-3">
                <code className="text-xs break-all">{jackpocketLink}</code>
              </div>
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => copyToClipboard(jackpocketLink, "jackpocket")}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedText === "jackpocket" ? "Copied!" : "Copy Link"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-300 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Code2 className="h-5 w-5" />
                Replit Referral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700 mb-3">$10 credit when users upgrade to Core</p>
              <div className="bg-white p-3 rounded border border-purple-200 mb-3">
                <code className="text-xs break-all">{replitLink}</code>
              </div>
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => copyToClipboard(replitLink, "replit")}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedText === "replit" ? "Copied!" : "Copy Link"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Platform-Specific Content */}
        <div className="space-y-8">
          {/* Twitter/X Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-500">𝕏</span>
                Twitter/X Posts
                <Badge variant="outline">Short & Punchy</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialPosts.twitter.map((post) => (
                  <div key={post.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="text-xs">{post.type}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(post.text, `twitter-${post.id}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedText === `twitter-${post.id}` ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{post.text}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>👥 {post.audience}</span>
                      <span>📈 {post.conversion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instagram Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-pink-500">📷</span>
                Instagram Posts
                <Badge variant="outline">Visual Storytelling</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialPosts.instagram.map((post) => (
                  <div key={post.id} className="border border-pink-200 rounded-lg p-4 bg-pink-50">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="text-xs">{post.type}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(post.text, `instagram-${post.id}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedText === `instagram-${post.id}` ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{post.text}</p>
                    <p className="text-xs text-pink-600 mb-2">📸 Visual: {post.visual}</p>
                    <span className="text-xs text-gray-500">👥 {post.audience}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* TikTok Scripts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎵</span>
                TikTok Scripts
                <Badge variant="outline">High Energy</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialPosts.tiktok.map((post) => (
                  <div key={post.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="text-xs">{post.type}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(post.script, `tiktok-${post.id}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedText === `tiktok-${post.id}` ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 mb-2"><strong>Script:</strong> {post.script}</p>
                    <p className="text-xs text-purple-600 mb-1">🎬 Visual: {post.visual}</p>
                    <p className="text-xs text-gray-500">#{post.hashtags}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Tips */}
        <Card className="mt-8 border-2 border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Trophy className="h-5 w-5" />
              Performance Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-3">⏰ Timing Strategy</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Jackpocket:</strong> Mid-week + Friday (build Saturday urgency)</li>
                  <li>• <strong>Replit:</strong> Weekdays (tech audience active)</li>
                  <li>• <strong>Peak Hours:</strong> 7-9 AM, 12-1 PM, 7-9 PM</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-3">🎯 Conversion Tactics</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>A/B Test CTAs:</strong> "Play Now" vs "Join the Jackpot"</li>
                  <li>• <strong>Engagement Questions:</strong> "What would you do with $350M?"</li>
                  <li>• <strong>Visual Hooks:</strong> Bright jackpot graphics, coding demos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Launch Your Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={() => window.open('https://twitter.com/compose/tweet', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Post to X/Twitter
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                onClick={() => window.open('https://www.instagram.com/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Post to Instagram
              </Button>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={() => window.open('https://www.tiktok.com/upload', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Create TikTok
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}