import { Request, Response, NextFunction } from 'express';

// Secure AdSense configuration endpoint
export function createAdSenseConfigEndpoint() {
  return (req: Request, res: Response) => {
    const publisherId = process.env.GOOGLE_ADSENSE_PUBLISHER_ID;
    
    // Only provide config if properly configured
    if (!publisherId || publisherId.startsWith('ca-pub-XXXXXXXXXXXXXXXX')) {
      return res.json({ enabled: false });
    }
    
    // Validate Publisher ID format
    if (!publisherId.match(/^ca-pub-\d{16}$/)) {
      return res.json({ enabled: false });
    }
    
    // Return secure config without exposing Publisher ID to logs
    res.json({
      enabled: true,
      scriptUrl: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
    });
  };
}

// Secure middleware for HTML injection (now just passes through)
export function injectAdSenseId(req: Request, res: Response, next: NextFunction) {
  // No longer needed - keeping for compatibility
  next();
}