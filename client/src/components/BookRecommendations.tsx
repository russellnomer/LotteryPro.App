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
            Russell's Gambling Strategy Books
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpenIcon className="h-4 w-4 text-green-600" />
          Russell's Gambling Strategy Books
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Master casino strategies with expert insights
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {books.map((book) => (
          <div 
            key={book.id}
            className="p-3 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 transition-all"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-sm leading-tight mb-2">
                  {book.title}
                </h4>
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
                    className="h-7 px-3 text-xs bg-amazon-orange hover:bg-amazon-orange/90 text-white"
                    onClick={() => window.open(book.amazonUrl, '_blank')}
                  >
                    <ShoppingCartIcon className="h-3 w-3 mr-1" />
                    Buy on Amazon
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t text-xs text-center text-muted-foreground">
          <p>📚 Available exclusively on Amazon</p>
          <p className="mt-1">
            <span className="font-medium text-green-600">Russell Nomer</span> - 
            Casino Strategy Expert & Lottery Analyst
          </p>
        </div>
      </CardContent>
    </Card>
  );
}