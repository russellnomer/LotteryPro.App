import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Music, Play, Pause, ExternalLink, Youtube, Headphones } from "lucide-react";
import { SiSoundcloud, SiBandcamp, SiSpotify } from "react-icons/si";

interface RussellSong {
  title: string;
  videoId: string;
  url: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  description?: string;
}

interface RussellMusicResponse {
  success: boolean;
  artist: string;
  channelId: string;
  count: number;
  songs: RussellSong[];
}

export default function RussellMusicPlayer() {
  const [currentSong, setCurrentSong] = useState<RussellSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch Russell's actual songs from YouTube
  const { data: musicData, isLoading, error } = useQuery<RussellMusicResponse>({
    queryKey: ['/api/russell-music'],
    retry: 2,
    staleTime: 300000, // 5 minutes
  });

  const songs = musicData?.songs || [];
  const featuredSongs = songs.slice(0, 4); // Show first 4 as featured

  const playSong = (song: RussellSong) => {
    setCurrentSong(song);
    setIsPlaying(true);
    // Open YouTube in new tab for actual playback
    window.open(song.url, '_blank', 'noopener,noreferrer');
  };

  const getYouTubeEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            🎵 Russell Nomer Music - Loading...
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Fetching Russell's latest songs from YouTube...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !musicData?.success) {
    return (
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            🎵 Russell Nomer Music
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Alert className="bg-amber-50 border-amber-300">
            <Youtube className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Unable to load Russell's live catalog.</strong> 
              <br />Visit Russell's channels directly:
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap gap-2">
            <a
              href="https://open.spotify.com/artist/54D6nzRoPPr5OWrefGMrQI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <SiSpotify className="h-5 w-5" />
              Spotify
            </a>
            <a
              href="https://russellnomer.bandcamp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
            >
              <SiBandcamp className="h-5 w-5" />
              Bandcamp (Best Quality)
            </a>
            <a
              href="https://soundcloud.com/russell-nomer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <SiSoundcloud className="h-5 w-5" />
              SoundCloud
            </a>
            <a
              href="https://youtube.com/@russellnomermusic"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <Youtube className="h-5 w-5" />
              YouTube
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            🎵 Russell Nomer Music
            <Badge variant="secondary" className="text-xs">
              {songs.length} Songs
            </Badge>
          </div>
          <Badge variant="outline" className="bg-white/20 text-white border-white/30">
            Live from YouTube
          </Badge>
        </CardTitle>
        <p className="text-purple-100">
          ✨ Russell's authentic music catalog - real tracks from his YouTube channel!
        </p>
        
        {/* YouTube Subscription Call-to-Action */}
        <div className="bg-red-500/30 rounded-lg p-3 mt-3 border border-red-400/50">
          <div className="text-white text-sm font-medium">
            🔔 <strong>SUBSCRIBE to @russellnomermusic!</strong> Get notified of new releases & help support Russell's recovery journey. 
            Every subscriber makes a real difference! 
            <strong className="text-red-200">It's FREE and helps immensely!</strong>
          </div>
        </div>
        
        {/* Alternative Streaming Platforms */}
        <div className="flex flex-wrap gap-2 mt-3">
          <a
            href="https://open.spotify.com/artist/54D6nzRoPPr5OWrefGMrQI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors"
          >
            <SiSpotify className="h-4 w-4" />
            Spotify
          </a>
          <a
            href="https://russellnomer.bandcamp.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-full text-sm font-medium transition-colors"
          >
            <SiBandcamp className="h-4 w-4" />
            Bandcamp
          </a>
          <a
            href="https://soundcloud.com/russell-nomer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-medium transition-colors"
          >
            <SiSoundcloud className="h-4 w-4" />
            SoundCloud
          </a>
          <a
            href="https://youtube.com/@russellnomermusic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors"
          >
            <Youtube className="h-4 w-4" />
            YouTube
          </a>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {songs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No songs found in Russell's catalog
          </div>
        ) : (
          <>
            {/* Featured Songs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredSongs.map((song, index) => (
                <div key={song.videoId} className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {song.thumbnailUrl && (
                      <img 
                        src={song.thumbnailUrl} 
                        alt={song.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate mb-1">
                        {song.title}
                      </h4>
                      {song.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {song.description.slice(0, 100)}...
                        </p>
                      )}
                      {song.publishedAt && (
                        <p className="text-xs text-gray-500 mb-2">
                          Released: {new Date(song.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => playSong(song)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Youtube className="h-3 w-3 mr-1" />
                          Play
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(song.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* All Songs List */}
            {songs.length > 4 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Complete Russell Nomer Catalog ({songs.length} songs)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {songs.map((song, index) => (
                    <div key={song.videoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{song.title}</div>
                        {song.publishedAt && (
                          <div className="text-sm text-gray-500">
                            {new Date(song.publishedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={() => playSong(song)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Youtube className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube Channel Link */}
            <div className="border-t pt-4 mt-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-700 font-medium">
                  🎵 Love the music? Subscribe to support Russell's recovery journey!
                </p>
                <Button 
                  size="lg"
                  onClick={() => window.open('https://youtube.com/@russellnomermusic?si=NdRd1TDGJfhSN1o0', '_blank')}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
                >
                  <Youtube className="h-5 w-5 mr-2" />
                  🔔 SUBSCRIBE to @russellnomermusic - IT'S FREE!
                </Button>
                <p className="text-xs text-gray-500">
                  Subscribers get notified of new music • Costs nothing • Helps Russell immensely
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}