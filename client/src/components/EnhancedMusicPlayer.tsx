import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlayIcon, PauseIcon, ExternalLinkIcon, MusicIcon, Heart, Share2, TrendingUp, DollarSign, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MusicContent } from "@shared/schema";

interface EnhancedMusicPlayerProps {
  featured?: boolean;
  compact?: boolean;
}

export default function EnhancedMusicPlayer({ featured = false, compact = false }: EnhancedMusicPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<MusicContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const { toast } = useToast();

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['/api/music', featured],
    queryFn: async () => {
      const response = await fetch(`/api/music${featured ? '?featured=true' : ''}`);
      if (!response.ok) throw new Error('Failed to fetch music');
      return response.json() as Promise<MusicContent[]>;
    }
  });

  // Convert YouTube URL to embeddable format
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1` : '';
  };

  // Get Spotify embed URL
  const getSpotifyEmbedUrl = (url: string): string => {
    const trackId = url.match(/track\/([a-zA-Z0-9]+)/)?.[1];
    return trackId ? `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0` : '';
  };

  const handlePlay = (track: MusicContent) => {
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
      setCurrentTrack(null);
      setEmbedUrl('');
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      
      // Try to create embed URL (prefer YouTube for higher visibility)
      let embed = '';
      if (track.trackUrl.includes('youtube.com') || track.trackUrl.includes('youtu.be')) {
        embed = getYouTubeEmbedUrl(track.trackUrl);
      } else if (track.trackUrl.includes('spotify.com')) {
        embed = getSpotifyEmbedUrl(track.trackUrl);
      }
      
      setEmbedUrl(embed);
    }
  };

  const handleShare = (track: MusicContent) => {
    if (navigator.share) {
      navigator.share({
        title: `${track.title} by Russell Nomer`,
        text: `Check out this song by Russell Nomer!`,
        url: track.trackUrl,
      });
    } else {
      navigator.clipboard.writeText(track.trackUrl);
      toast({
        title: "Link Copied!",
        description: "Share Russell's music to earn fan loyalty points in our contest!"
      });
    }
  };

  const handleLike = (track: MusicContent) => {
    toast({
      title: "Track Liked! ❤️",
      description: `Liked "${track.title}"! Share on social media to earn fan loyalty contest points.`
    });
  };

  if (isLoading) {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-4xl"}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MusicIcon className="h-5 w-5" />
            Russell Nomer Music
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tracks || tracks.length === 0) {
    return null;
  }

  const displayTracks = compact ? tracks.slice(0, 3) : tracks;

  return (
    <Card className={compact ? "w-full" : "w-full max-w-4xl"}>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <MusicIcon className="h-6 w-6" />
          🎵 Russell Nomer Music
          {featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
        </CardTitle>
        <p className="text-purple-100">
          ✨ Real tracks from Russell's catalog - listen while picking your lucky numbers!
        </p>
        
        {/* Streaming Royalty Education */}
        <Alert className="mt-3 bg-yellow-100 border-yellow-400">
          <DollarSign className="h-4 w-4" />
          <AlertDescription className="text-yellow-800 text-sm">
            <strong>💰 ASCAP Member Streaming Reality:</strong> Apple Music pays $0.00735/stream vs Spotify's $0.004. 
            YouTube pays $0.0007/stream. <strong>Like, share & buy books to truly support Russell!</strong>
          </AlertDescription>
        </Alert>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Current Playing Track Embed */}
        {currentTrack && embedUrl && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
            <h3 className="font-semibold mb-3 flex items-center">
              <PlayIcon className="h-4 w-4 mr-2" />
              Now Playing: {currentTrack.title}
            </h3>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={`${currentTrack.title} by Russell Nomer`}
              />
            </div>
            <div className="mt-3 flex gap-2 justify-center">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleLike(currentTrack)}
                className="flex items-center gap-1"
              >
                <Heart className="h-3 w-3" />
                Like
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleShare(currentTrack)}
                className="flex items-center gap-1"
              >
                <Share2 className="h-3 w-3" />
                Share
              </Button>
            </div>
          </div>
        )}

        {/* Track List */}
        <div className="space-y-3">
          {displayTracks.map((track) => (
            <div 
              key={track.id}
              className="p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all duration-300"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm leading-tight mb-1">
                    {track.title}
                  </h4>
                  {track.description && (
                    <p className="text-xs text-gray-600 mb-2">
                      {track.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {track.genre}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {track.duration}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={currentTrack?.id === track.id && isPlaying ? "default" : "outline"}
                    onClick={() => handlePlay(track)}
                    className="flex items-center gap-1"
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <PauseIcon className="h-3 w-3" />
                    ) : (
                      <PlayIcon className="h-3 w-3" />
                    )}
                    {currentTrack?.id === track.id && isPlaying ? 'Stop' : 'Play'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLike(track)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600"
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleShare(track)}
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Streaming Platform Comparison & Call to Action */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              💡 How Artists Really Get Paid (2024)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-blue-600">Apple Music (Best for ASCAP)</div>
                <div>$0.00735 per stream</div>
                <div className="text-gray-600">Need ~136,000 streams for $1,000</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-purple-600">Spotify</div>
                <div>$0.00437 per stream</div>
                <div className="text-gray-600">Need ~230,000 streams for $1,000</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-red-600">YouTube Music</div>
                <div>$0.0007 per stream</div>
                <div className="text-gray-600">Need ~1.4M streams for $1,000</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded border border-green-300">
              <h5 className="font-semibold text-green-800 mb-2 flex items-center text-sm">
                🎼 ASCAP Member Benefits & Networking
              </h5>
              <div className="text-xs text-green-700 space-y-1">
                <p>📺 <strong>TV/Film Placement:</strong> Russell's ASCAP membership enables music licensing for shows, commercials, films</p>
                <p>🎬 <strong>Industry Networking:</strong> Connect with show runners, producers, music supervisors for placement opportunities</p>
                <p>💰 <strong>Performance Royalties:</strong> ASCAP collects and distributes royalties from broadcast, streaming, live performances</p>
                <p>🎵 <strong>Music Sync Opportunities:</strong> Lottery/gambling themes perfect for casino scenes, sports betting content</p>
              </div>
            </div>
          </div>

          <Alert className="bg-gradient-to-r from-orange-100 to-red-100 border-orange-300">
            <Award className="h-4 w-4" />
            <AlertDescription>
              <strong>🏆 Support Russell Directly:</strong> Streaming pays pennies! Like & share music, 
              buy his gambling strategy books, and join the VIP fan loyalty contest for exclusive rewards!
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}