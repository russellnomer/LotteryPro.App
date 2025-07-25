import { Request, Response, NextFunction } from 'express';

// Middleware to inject AdSense Publisher ID into HTML responses
export function injectAdSenseId(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (typeof data === 'string' && data.includes('GOOGLE_ADSENSE_PUBLISHER_ID_PLACEHOLDER')) {
      const publisherId = process.env.GOOGLE_ADSENSE_PUBLISHER_ID || 'ca-pub-XXXXXXXXXXXXXXXX';
      data = data.replace('GOOGLE_ADSENSE_PUBLISHER_ID_PLACEHOLDER', publisherId);
    }
    return originalSend.call(this, data);
  };
  
  next();
}