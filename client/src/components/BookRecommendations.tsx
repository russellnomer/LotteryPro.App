import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpenIcon, ExternalLinkIcon, ShoppingCartIcon } from "lucide-react";
import type { BookRecommendation } from "@shared/schema";

interface BookRecommendationsProps {
  compact?: boolean;
}

export default function BookRecommendations({ compact = false }: BookRecommendationsProps) {
  const { data: books, isLoading } = useQuery({
    queryKey: ['/api/books'],
    queryFn: async () => {
      const response = await fetch('/api/books');
      if (!response.ok) throw new Error('Failed to fetch books');
      return response.json() as Promise<BookRecommendation[]>;
    }
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpenIcon className="h-4 w-4" />
            📚 Books by Russell Nomer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!books || books.length === 0) {
    return null;
  }

  return (
    <Card className="w-full border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <BookOpenIcon className="h-5 w-5" />
          📚 Books by Russell Nomer
        </CardTitle>
        <p className="text-orange-100 font-medium">
          ⚡ Browse the complete collection of published works
        </p>
        <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-400">
          <p className="text-yellow-800 text-xs font-medium">
            💰 <strong>Support Independent Artists:</strong> Book purchases directly support Russell's music career! 
            Streaming pays artists only $0.003-0.013 per play.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {books.map((book) => {
          const isTheGrove = book.title.toLowerCase().includes('the grove');
          return (
            <div 
              key={book.id}
              className={`p-4 rounded-xl border-2 ${
                isTheGrove 
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 ring-2 ring-green-300' 
                  : 'border-orange-300 bg-white'
              } hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-sm leading-tight">
                      {book.title}
                    </h4>
                    {isTheGrove && (
                      <Badge className="bg-green-600 text-white text-xs px-1.5 py-0">
                        🌟 NEW RELEASE
                      </Badge>
                    )}
                  </div>
                  {book.description && !compact && (
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                      {book.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-0 capitalize"
                    >
                      {book.category}
                    </Badge>
                    <Button
                      size="sm"
                      className={`h-8 px-4 text-xs font-bold ${
                        isTheGrove
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                      } text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300`}
                      onClick={() => window.open(book.amazonUrl, '_blank')}
                    >
                      <ShoppingCartIcon className="h-3 w-3 mr-1" />
                      {isTheGrove ? '🌟 Order Now!' : '🛒 Buy & Support Russell!'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        <p className="mt-3 font-bold text-center" style={{ color: "#DC3545", fontSize: "12px" }}>
          #ad As an Amazon Associate, I earn from qualifying purchases at no extra cost to you (FTC compliant).
        </p>
        
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center text-sm">
            <BookOpenIcon className="h-3 w-3 mr-1" />
            Why Support Independent Authors & Musicians?
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>🎵 <strong>ASCAP Streaming Reality:</strong> Apple Music pays best at $0.00735/stream (ASCAP members can't use TIDAL)</p>
            <p>📚 <strong>Book Sales:</strong> Direct support that funds new research, music production, and content creation</p>
            <p>🎯 <strong>Your Impact:</strong> Every purchase helps Russell continue developing winning strategies and music</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}