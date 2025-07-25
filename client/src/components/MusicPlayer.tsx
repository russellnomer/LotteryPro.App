import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, ExternalLinkIcon, MusicIcon } from "lucide-react";
import type { MusicContent } from "@shared/schema";

interface MusicPlayerProps {
  featured?: boolean;
  compact?: boolean;
}

export default function MusicPlayer({ featured = false, compact = false }: MusicPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<MusicContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['/api/music', featured],
    queryFn: async () => {
      const response = await fetch(`/api/music${featured ? '?featured=true' : ''}`);
      if (!response.ok) throw new Error('Failed to fetch music');
      return response.json() as Promise<MusicContent[]>;
    }
  });

  const handlePlay = (track: MusicContent) => {
    if (currentTrack?.id === track.id && isPlaying) {
      setIsPlaying(false);
      setCurrentTrack(null);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      // Open track in new tab for actual playback
      window.open(track.trackUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-md"}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MusicIcon className="h-4 w-4" />
            Russell Nomer Music
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
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
    <Card className={compact ? "w-full" : "w-full max-w-md"}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MusicIcon className="h-4 w-4 text-purple-600" />
          Russell Nomer Music
          {featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Listen while selecting your lucky numbers
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayTracks.map((track) => (
          <div 
            key={track.id} 
            className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-800/30 dark:hover:to-blue-800/30 transition-all"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{track.trackTitle}</h4>
              <div className="flex items-center gap-2 mt-1">
                {track.genre && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {track.genre}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground capitalize">
                  {track.platform}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => handlePlay(track)}
              >
                {currentTrack?.id === track.id && isPlaying ? (
                  <PauseIcon className="h-3 w-3" />
                ) : (
                  <PlayIcon className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => window.open(track.trackUrl, '_blank')}
              >
                <ExternalLinkIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {compact && tracks.length > 3 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => window.open('https://unitedmasters.com/a/russell-nomer-music', '_blank')}
          >
            View All {tracks.length} Tracks
          </Button>
        )}

        <div className="pt-2 border-t text-xs text-center text-muted-foreground">
          <p>🎵 Music by Russell Nomer</p>
          <div className="flex justify-center gap-3 mt-1">
            <button
              onClick={() => window.open('https://soundcloud.com/russell-nomer', '_blank')}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              SoundCloud
            </button>
            <button
              onClick={() => window.open('https://unitedmasters.com/a/russell-nomer-music', '_blank')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              UnitedMasters
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}