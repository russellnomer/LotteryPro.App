import { Router } from 'express';
import youtubeService from '../youtubeService';

const router = Router();

// Get Russell Nomer's actual songs from YouTube
router.get('/russell-songs', async (req, res) => {
  try {
    const songs = await youtubeService.getRussellNomerSongs();
    res.json({
      success: true,
      count: songs.length,
      songs: songs
    });
  } catch (error) {
    console.error('Error fetching Russell Nomer songs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Russell Nomer songs from YouTube',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific video details
router.get('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoDetails = await youtubeService.getVideoDetails(videoId);
    
    if (!videoDetails) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    res.json({
      success: true,
      video: videoDetails
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video details'
    });
  }
});

export default router;