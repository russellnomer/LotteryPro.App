import type { Request, Response, NextFunction } from "express";
import { logError } from "../logging";

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  const errorType = statusCode >= 500 ? 'unhandled_exception' : 'api_error';
  
  logError(
    errorType,
    err,
    req,
    {
      statusCode,
      isOperational: err.isOperational || false,
      timestamp: new Date().toISOString(),
    }
  ).catch(logErr => {
    console.error('Failed to log error:', logErr);
  });
  
  const errorResponse: Record<string, any> = {
    success: false,
    error: {
      message: isProduction && statusCode === 500 
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal Server Error',
      code: statusCode,
    },
  };
  
  if (!isProduction) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.path = req.path;
    errorResponse.error.method = req.method;
  }
  
  res.status(statusCode).json(errorResponse);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(`Cannot ${req.method} ${req.path}`, 404);
  next(error);
}
