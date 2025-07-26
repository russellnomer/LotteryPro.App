import express, { Router } from 'express';
import { storage } from '../storage';
import type { Request, Response } from 'express';

const router = Router();

// Get contest data and leaderboard
router.get('/', async (req: Request, res: Response) => {
  try {
    // Mock data for now - in production, fetch from database
    const contestData = {
      entries: [
        {
          id: '1',
          userId: 'user1',
          userName: 'LotteryLover23',
          entryType: 'music_share',
          content: 'Shared Russell\'s latest track "Lucky Numbers" on Instagram with #RussellNomerMusic',
          proofUrl: 'https://instagram.com/p/example',
          loyaltyScore: 25,
          submittedAt: new Date().toISOString(),
          approved: true
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'CasinoExpert',
          entryType: 'book_review',
          content: 'Left 5-star review for "Advanced Blackjack Strategies" on Amazon',
          proofUrl: 'https://amazon.com/review/example',
          loyaltyScore: 75,
          submittedAt: new Date().toISOString(),
          approved: true
        }
      ],
      leaderboard: [
        { userName: 'CasinoExpert', totalScore: 275, rank: 1 },
        { userName: 'PowerballPro', totalScore: 210, rank: 2 },
        { userName: 'LuckyNumbers88', totalScore: 185, rank: 3 },
        { userName: 'LotteryLover23', totalScore: 125, rank: 4 },
        { userName: 'SlotMaster', totalScore: 95, rank: 5 }
      ],
      prizePool: {
        vipCodes: 10,
        bonusCredits: 500
      }
    };

    res.json(contestData);
  } catch (error: any) {
    console.error('Contest data fetch error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch contest data' });
  }
});

// Submit contest entry
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { entryType, content, proofUrl } = req.body;
    
    if (!entryType || !content) {
      return res.status(400).json({ message: 'Entry type and content are required' });
    }

    // Calculate loyalty score based on entry type
    const scoreMap = {
      'music_share': Math.floor(Math.random() * 16) + 10, // 10-25 points
      'book_review': Math.floor(Math.random() * 51) + 50, // 50-100 points
      'fan_story': Math.floor(Math.random() * 51) + 25,   // 25-75 points
      'social_media_post': Math.floor(Math.random() * 26) + 15 // 15-40 points
    };

    const loyaltyScore = scoreMap[entryType as keyof typeof scoreMap] || 10;

    // In production, save to database
    const entry = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'temp_user', // Replace with actual user ID from session
      userName: 'Anonymous Fan',
      entryType,
      content,
      proofUrl: proofUrl || null,
      loyaltyScore,
      submittedAt: new Date().toISOString(),
      approved: false // Requires admin approval
    };

    console.log('New contest entry:', entry);

    res.json({ 
      success: true, 
      entry,
      message: 'Contest entry submitted successfully! Awaiting approval for points.' 
    });

  } catch (error: any) {
    console.error('Contest submission error:', error);
    res.status(500).json({ message: error.message || 'Failed to submit contest entry' });
  }
});

// Admin: Approve contest entry
router.post('/admin/approve/:entryId', async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;
    const { approved, points } = req.body;

    // In production, update database entry
    console.log(`Admin ${approved ? 'approved' : 'rejected'} contest entry ${entryId} for ${points} points`);

    res.json({ 
      success: true, 
      message: `Contest entry ${approved ? 'approved' : 'rejected'} successfully` 
    });

  } catch (error: any) {
    console.error('Contest approval error:', error);
    res.status(500).json({ message: error.message || 'Failed to approve contest entry' });
  }
});

// Admin: Award VIP codes to winners
router.post('/admin/award-winners', async (req: Request, res: Response) => {
  try {
    const { winnerCount = 10 } = req.body;

    // In production, generate VIP codes and assign to top winners
    const winners = [
      'CasinoExpert',
      'PowerballPro', 
      'LuckyNumbers88',
      'LotteryLover23',
      'SlotMaster'
    ].slice(0, winnerCount);

    console.log(`Awarding VIP codes to top ${winnerCount} contest winners:`, winners);

    res.json({ 
      success: true, 
      winners,
      message: `VIP codes awarded to top ${winnerCount} contest winners!` 
    });

  } catch (error: any) {
    console.error('Winner award error:', error);
    res.status(500).json({ message: error.message || 'Failed to award winners' });
  }
});

export default router;