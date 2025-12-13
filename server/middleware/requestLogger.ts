import type { Request, Response, NextFunction } from "express";
import { logAudit } from "../logging";

const SLOW_REQUEST_THRESHOLD = 1000;

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (!req.path.startsWith('/api')) {
    return next();
  }
  
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  (req as any).requestId = requestId;
  (req as any).startTime = startTime;
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isSlowRequest = duration > SLOW_REQUEST_THRESHOLD;
    
    const shouldLog = 
      isSlowRequest || 
      res.statusCode >= 400 || 
      req.path.includes('/admin') ||
      req.path.includes('/auth') ||
      req.method !== 'GET';
    
    if (shouldLog) {
      const severity = isSlowRequest ? 'warning' : 
                       res.statusCode >= 500 ? 'error' :
                       res.statusCode >= 400 ? 'warning' : 'info';
      
      logAudit(
        'api_request',
        req.path.includes('/admin') ? 'admin' : 
        req.path.includes('/auth') ? 'auth' : 'user_action',
        req,
        {
          requestId,
          duration,
          isSlowRequest,
          contentLength: res.get('content-length'),
        },
        severity,
        res.statusCode
      ).catch(err => {
        console.error('Failed to log request:', err);
      });
    }
    
    if (isSlowRequest) {
      console.warn(`🐌 Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || 
                    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  (req as any).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  
  next();
}
