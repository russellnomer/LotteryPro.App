import { google } from 'googleapis';

interface YouTubeVideo {
  title: string;
  videoId: string;
  url: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  description?: string;
}

class YouTubeService {
  private youtube;
  private readonly channelId = 'UCAiOa4F7HAyxgHaDlRPw6vA'; // Russell Nomer's channel

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.GOOGLE_API_KEY
    });
  }

  async getRussellNomerSongs(): Promise<YouTubeVideo[]> {
    try {
      // First, get the uploads playlist ID for Russell's channel
      const channelResponse = await this.youtube.channels.list({
        part: ['contentDetails'],
        id: [this.channelId]
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads;
      
      if (!uploadsPlaylistId) {
        throw new Error('Uploads playlist not found');
      }

      // Get all videos from the uploads playlist
      const allVideos: YouTubeVideo[] = [];
      let nextPageToken: string | undefined;

      do {
        const playlistResponse = await this.youtube.playlistItems.list({
          part: ['snippet'],
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          pageToken: nextPageToken
        });

        if (playlistResponse.data.items) {
          for (const item of playlistResponse.data.items) {
            const snippet = item.snippet;
            if (snippet && snippet.resourceId) {
              const video: YouTubeVideo = {
                title: snippet.title ?? 'Untitled',
                videoId: snippet.resourceId.videoId || '',
                url: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
                thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
                publishedAt: snippet.publishedAt ?? undefined,
                description: snippet.description ?? undefined
              };
              allVideos.push(video);
            }
          }
        }

        nextPageToken = playlistResponse.data.nextPageToken || undefined;
      } while (nextPageToken);

      // Remove duplicates by videoId and clean up titles
      const uniqueVideos = new Map<string, YouTubeVideo>();
      
      for (const video of allVideos) {
        if (video.videoId && !uniqueVideos.has(video.videoId)) {
          // Clean up common duplicate patterns in titles
          let cleanTitle = video.title
            .replace(/\s+·\s+Russell Nomer.*$/g, '') // Remove "· Russell Nomer · Artist Name" suffixes
            .replace(/\s+\(.*Russell Nomer.*\)$/g, '') // Remove "(Russell Nomer)" suffixes
            .replace(/\s+-\s+Russell Nomer.*$/g, '') // Remove "- Russell Nomer" suffixes
            .replace(/^Russell Nomer\s+-\s+/g, '') // Remove "Russell Nomer - " prefixes
            .replace(/^Russell Nomer\s+/g, '') // Remove "Russell Nomer " prefixes
            .trim();
          
          uniqueVideos.set(video.videoId, {
            ...video,
            title: cleanTitle || video.title // Fallback to original if cleaning results in empty
          });
        }
      }

      const finalVideos = Array.from(uniqueVideos.values());
      console.log(`✅ Fetched ${finalVideos.length} unique Russell Nomer songs from YouTube (cleaned ${allVideos.length - finalVideos.length} duplicates)`);
      return finalVideos;

    } catch (error) {
      console.error('Error fetching Russell Nomer YouTube videos:', error);
      throw error;
    }
  }

  async getVideoDetails(videoId: string) {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [videoId]
      });

      return response.data.items?.[0] || null;
    } catch (error) {
      console.error(`Error fetching video details for ${videoId}:`, error);
      return null;
    }
  }
}

export default new YouTubeService();