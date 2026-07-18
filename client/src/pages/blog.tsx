import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Calendar, ArrowRight, BookOpen, BarChart2, Flame } from "lucide-react";

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  content: string;
  published: boolean;
  publishedAt: string | null;
  author: string;
  ogImageUrl: string | null;
  category: string;
  readTimeMinutes: number;
}

interface RelatedPostData {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  category: string;
  readTimeMinutes: number;
  publishedAt: string | null;
  author: string;
}

const categoryColors: Record<string, string> = {
  Analysis: "bg-blue-100 text-blue-800",
  Education: "bg-green-100 text-green-800",
  Strategy: "bg-purple-100 text-purple-800",
  Methods: "bg-orange-100 text-orange-800",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "LotteryPro";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderMarkdown(content: string): string[] {
  return content.split(/\n\n+/);
}

export function BlogIndex() {
  const { data, isLoading } = useQuery<{ success: boolean; posts: BlogPostData[] }>({
    queryKey: ["/api/blog"],
  });

  const posts = data?.posts ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Lottery Analysis Blog - Tips, Stats & Strategies"
        description="Educational articles about lottery number analysis, frequency statistics, pool strategies, and smart number generation methods. Data-driven insights from LotteryPro."
        path="/blog"
        type="website"
      />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LotteryPro Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Educational articles about lottery statistics, number analysis methods, and smart play strategies. All content is for informational and entertainment purposes only.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-56">
                <CardHeader>
                  <Skeleton className="h-5 w-20 mb-3" />
                  <Skeleton className="h-6 w-full mb-1" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={categoryColors[post.category] || "bg-gray-100 text-gray-800"}
                        variant="secondary"
                      >
                        {post.category}
                      </Badge>
                      <span className="flex items-center text-xs text-gray-400 gap-1">
                        <Clock size={12} />
                        {post.readTimeMinutes} min read
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 leading-tight">
                      {post.title}
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {post.metaDescription}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-xs text-gray-400 gap-1">
                        <Calendar size={12} />
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                        Read more <ArrowRight size={14} />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Featured Stats Section — links to live stat pages for SEO depth */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-600" />
            Live Frequency Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/powerball/hot-numbers">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={16} className="text-red-500" />
                    <Badge className="bg-red-100 text-red-800" variant="secondary">Live Data</Badge>
                  </div>
                  <CardTitle className="text-base leading-tight">Powerball Hot Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Which Powerball numbers appear most often? See real frequency rankings across 2,000+ official draws.
                  </p>
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                    View frequency chart <ArrowRight size={14} />
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/megamillions/hot-numbers">
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={16} className="text-orange-500" />
                    <Badge className="bg-orange-100 text-orange-800" variant="secondary">Live Data</Badge>
                  </div>
                  <CardTitle className="text-base leading-tight">Mega Millions Hot Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Explore Mega Millions draw frequency across 1,500+ results. Updated after every drawing.
                  </p>
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                    View frequency chart <ArrowRight size={14} />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            Ready to try smart picks?
          </h2>
          <p className="text-blue-200 mb-6 max-w-lg mx-auto">
            Generate your lottery numbers free using real historical data and statistical analysis methods.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8">
              Generate Your Numbers Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data, isLoading, isError } = useQuery<{ success: boolean; post: BlogPostData; related: RelatedPostData[] }>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  const post = data?.post;
  const related = data?.related ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-5 w-20 mb-3" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-3/4 mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </article>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist or has been unpublished.</p>
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const paragraphs = renderMarkdown(post.content);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={post.title}
        description={post.metaDescription}
        path={`/blog/${post.slug}`}
        type="article"
        image={post.ogImageUrl || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "description": post.metaDescription,
          "author": {
            "@type": "Organization",
            "name": post.author || "LotteryPro Team",
          },
          "publisher": {
            "@type": "Organization",
            "name": "LotteryPro",
            "url": "https://lotterypro.app",
          },
          "datePublished": post.publishedAt,
          "url": `https://lotterypro.app/blog/${post.slug}`,
        }}
      />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} className="mr-2" />
            Back to Blog
          </Button>
        </Link>

        <header className="mb-10">
          <Badge className={categoryColors[post.category] || "bg-gray-100 text-gray-800"} variant="secondary">
            {post.category}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <BookOpen size={14} />
              {post.author || "LotteryPro Team"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readTimeMinutes} min read
            </span>
          </div>
        </header>

        <div className="prose prose-gray max-w-none space-y-5">
          {paragraphs.map((para, i) => {
            const trimmed = para.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith("## ")) {
              return (
                <h2 key={i} className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                  {trimmed.replace(/^## /, "")}
                </h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={i} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  {trimmed.replace(/^### /, "")}
                </h3>
              );
            }
            if (trimmed.startsWith("> ")) {
              return (
                <blockquote key={i} className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-50 rounded-r-lg">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {trimmed.replace(/^> \*\*/, "").replace(/\*\*/, ": ").replace(/\*\*/, "")}
                  </p>
                </blockquote>
              );
            }
            if (trimmed.startsWith("- ") || /^\d+\. /.test(trimmed)) {
              const lines = trimmed.split("\n");
              return (
                <ul key={i} className="space-y-2 text-gray-700">
                  {lines.map((line, li) => {
                    const bullet = line.replace(/^[-\d]+\.?\s*/, "").trim();
                    return bullet ? (
                      <li key={li} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1 shrink-0">•</span>
                        <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                      </li>
                    ) : null;
                  })}
                </ul>
              );
            }
            return (
              <p
                key={i}
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Disclaimer:</strong> This article is for informational and entertainment purposes only. Lottery games are games of chance, and no analysis method, strategy, or system can guarantee winning outcomes. Past drawing results do not influence future results. Always play responsibly and within your budget. If you or someone you know has a gambling problem, call 1-800-GAMBLER for help.
          </p>
        </div>

        {/* Related Articles — same category, returned from API */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
                    <CardHeader className="pb-2">
                      <Badge
                        className={categoryColors[r.category] || "bg-gray-100 text-gray-800"}
                        variant="secondary"
                      >
                        {r.category}
                      </Badge>
                      <CardTitle className="text-sm font-semibold text-gray-900 mt-2 leading-snug">
                        {r.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{r.metaDescription}</p>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={11} />
                        {r.readTimeMinutes} min read
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Link back to live stat pages for contextual depth */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/powerball/hot-numbers">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Flame size={13} className="text-red-500" />
              Powerball Hot Numbers
            </Button>
          </Link>
          <Link href="/megamillions/hot-numbers">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Flame size={13} className="text-orange-500" />
              Mega Millions Hot Numbers
            </Button>
          </Link>
          <Link href="/blog">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <BarChart2 size={13} />
              All Articles
            </Button>
          </Link>
        </div>

        <div className="mt-10 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-3">
            Try LotteryPro's Analysis Tools
          </h2>
          <p className="text-blue-200 mb-5">
            Explore real historical data from 2,020+ Powerball and 1,590+ Mega Millions draws.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
