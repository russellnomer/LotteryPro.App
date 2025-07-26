import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpenIcon, ExternalLinkIcon, ShoppingCartIcon, ArrowLeft, Heart, Star, Target } from "lucide-react";
import AdSpace from "@/components/AdSpace";
import type { BookRecommendation } from "@shared/schema";

export default function Books() {
  const [userTier, setUserTier] = useState<'free' | 'basic' | 'pro' | 'premium'>('free');

  const { data: books, isLoading, error } = useQuery({
    queryKey: ['/api/books'],
    queryFn: async () => {
      const response = await fetch('/api/books');
      if (!response.ok) throw new Error('Failed to fetch books');
      return response.json() as Promise<BookRecommendation[]>;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Books</h2>
              <p className="text-red-600">Unable to load Russell's book collection. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                onClick={() => window.location.href = '/music'}
                className="text-gray-600 hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Music Platform
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-2xl font-bold text-primary">
                <BookOpenIcon className="h-6 w-6 mr-2 inline" />
                Russell's Books
              </h1>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Strategy & Entertainment
              </Badge>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-primary transition-colors">AI Lottery Pro</a>
              <a href="/music" className="text-gray-600 hover:text-primary transition-colors">Russell's Music</a>
              <a href="/books" className="text-primary font-semibold transition-colors">Books</a>
              <a href="/fan-contest" className="text-gray-600 hover:text-primary transition-colors">Fan Contest</a>
              <a href="/support" className="text-gray-600 hover:text-primary transition-colors">Support Russell</a>
            </nav>
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
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">📚 Russell Nomer's Gaming Strategy Library</h2>
            <p className="text-orange-100 text-lg mb-6">
              Master casino strategies with proven expert insights from an experienced gambling strategist
            </p>
            <div className="flex justify-center gap-4 mb-6">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Target className="h-4 w-4 mr-2" />
                Strategy Expert
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Star className="h-4 w-4 mr-2" />
                Published Author
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Heart className="h-4 w-4 mr-2" />
                Support Russell
              </Badge>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-orange-100 text-sm mb-3">
                Browse Russell's complete collection on Amazon
              </p>
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 font-bold"
                onClick={() => window.open('https://amzn.to/4op76h9', '_blank')}
              >
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                View All Books on Amazon
              </Button>
            </div>
          </div>
        </div>

        {/* Support Message */}
        <Card className="mb-8 border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Support Russell's Recovery Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong>Russell is recovering from cervical spinal fusion surgery</strong> and has been out of work for two years 
                due to constant pain. Every book purchase directly supports his recovery and helps maintain his 
                independence while he rebuilds his income streams.
              </p>
              <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💰 Why Book Sales Matter More Than Streaming</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Book sales:</strong> $2-5 per purchase (direct support)</li>
                  <li>• <strong>Music streaming:</strong> $0.003-0.013 per play (minimal royalties)</li>
                  <li>• <strong>Impact:</strong> One book purchase = 400-1,600 music streams</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Books Grid */}
          <div className="lg:col-span-3">
            {books && books.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {books.map((book) => (
                  <Card 
                    key={book.id} 
                    className="border-2 border-orange-300 bg-white hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <CardHeader className="bg-gradient-to-r from-orange-100 to-red-100">
                      <CardTitle className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 leading-tight">
                            {book.title}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className="mt-2 text-xs px-2 py-1 capitalize border-orange-400 text-orange-700"
                          >
                            {book.category}
                          </Badge>
                        </div>
                        <BookOpenIcon className="h-6 w-6 text-orange-600 flex-shrink-0 ml-2" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {book.description && (
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {book.description}
                        </p>
                      )}
                      <div className="space-y-3">
                        <Button
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                          onClick={() => window.open(book.amazonUrl, '_blank')}
                        >
                          <ShoppingCartIcon className="h-4 w-4 mr-2" />
                          🛒 Buy & Support Russell!
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          Secure purchase through Amazon
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <CardContent>
                  <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Books Available</h3>
                  <p className="text-gray-500">Russell's book collection is being updated. Check back soon!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Explore Russell's Platform</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/'}
                >
                  🤖 AI Lottery Analytics
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/music'}
                >
                  🎵 Music Collection
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/fan-contest'}
                >
                  👑 Fan Contest
                </Button>
              </CardContent>
            </Card>

            {/* Ad Space for Free Users */}
            {userTier === 'free' && (
              <div className="flex justify-center">
                <AdSpace size="square" position="Sidebar" />
              </div>
            )}

            {/* About Russell */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">About Russell Nomer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-purple-700">
                <p className="mb-3">
                  Russell is a multi-talented creator combining gambling strategy expertise, 
                  music artistry, and AI-powered lottery analytics.
                </p>
                <p>
                  Currently recovering from spinal surgery, Russell's books and platform 
                  represent years of research and creative work.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}