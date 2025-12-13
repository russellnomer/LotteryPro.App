import { db } from "./db";
import { auditLogs, errorLogs } from "@shared/schema";
import type { Request } from "express";

export type AuditEventType = 
  | 'login' 
  | 'logout' 
  | 'spin' 
  | 'claim_prize' 
  | 'payment' 
  | 'tier_change' 
  | 'admin_access' 
  | 'security_alert'
  | 'generate_numbers'
  | 'subscription_change'
  | 'api_request';

export type AuditEventCategory = 
  | 'auth' 
  | 'transaction' 
  | 'admin' 
  | 'security' 
  | 'user_action';

export type ErrorType = 
  | 'unhandled_exception' 
  | 'api_error' 
  | 'validation_error' 
  | 'database_error' 
  | 'frontend_error';

export type Severity = 'info' | 'warning' | 'error' | 'critical';

interface ClientInfo {
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  sessionId: string | null;
}

export function extractClientInfo(req: Request): ClientInfo {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = typeof forwardedFor === 'string' 
    ? forwardedFor.split(',')[0].trim() 
    : req.ip || req.socket?.remoteAddress || null;
  
  const userAgent = req.headers['user-agent'] || null;
  const userId = (req as any).user?.id || null;
  const sessionId = req.sessionID || null;
  
  return {
    ipAddress,
    userAgent,
    userId,
    sessionId
  };
}

export async function logAudit(
  eventType: AuditEventType,
  eventCategory: AuditEventCategory,
  req: Request,
  details?: Record<string, any>,
  severity: Severity = 'info',
  statusCode?: number
): Promise<void> {
  try {
    const clientInfo = extractClientInfo(req);
    
    await db.insert(auditLogs).values({
      eventType,
      eventCategory,
      userId: clientInfo.userId,
      sessionId: clientInfo.sessionId,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      requestPath: req.path,
      requestMethod: req.method,
      statusCode: statusCode || null,
      details: details || null,
      severity,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function logError(
  errorType: ErrorType,
  error: Error | string,
  req?: Request,
  context?: Record<string, any>
): Promise<string | null> {
  try {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'string' ? null : error.stack || null;
    
    let clientInfo: ClientInfo = {
      ipAddress: null,
      userAgent: null,
      userId: null,
      sessionId: null
    };
    
    let requestPath: string | null = null;
    let requestMethod: string | null = null;
    let requestBody: Record<string, any> | null = null;
    
    if (req) {
      clientInfo = extractClientInfo(req);
      requestPath = req.path;
      requestMethod = req.method;
      
      if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'credit_card'];
        sensitiveFields.forEach(field => {
          if (sanitizedBody[field]) {
            sanitizedBody[field] = '[REDACTED]';
          }
        });
        requestBody = sanitizedBody;
      }
    }
    
    const [result] = await db.insert(errorLogs).values({
      errorType,
      errorMessage,
      stackTrace,
      userId: clientInfo.userId,
      sessionId: clientInfo.sessionId,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      requestPath,
      requestMethod,
      requestBody,
      context: context || null,
      resolved: 0,
      resolvedBy: null,
    }).returning({ id: errorLogs.id });
    
    return result?.id || null;
  } catch (dbError) {
    console.error('Failed to log error to database:', dbError);
    console.error('Original error:', error);
    return null;
  }
}

export async function markErrorResolved(
  errorId: string,
  resolvedBy: string
): Promise<boolean> {
  try {
    const { eq } = await import('drizzle-orm');
    
    await db.update(errorLogs)
      .set({
        resolved: 1,
        resolvedAt: new Date(),
        resolvedBy,
      })
      .where(eq(errorLogs.id, errorId));
    
    return true;
  } catch (error) {
    console.error('Failed to mark error as resolved:', error);
    return false;
  }
}

export async function getAuditLogs(filters?: {
  eventType?: string;
  eventCategory?: string;
  userId?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const { desc, eq, and, gte, lte, sql } = await import('drizzle-orm');
    
    const conditions: any[] = [];
    
    if (filters?.eventType) {
      conditions.push(eq(auditLogs.eventType, filters.eventType));
    }
    if (filters?.eventCategory) {
      conditions.push(eq(auditLogs.eventCategory, filters.eventCategory));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.severity) {
      conditions.push(eq(auditLogs.severity, filters.severity));
    }
    if (filters?.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(auditLogs.createdAt, filters.endDate));
    }
    
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    
    const query = db.select().from(auditLogs);
    
    if (conditions.length > 0) {
      return await query
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

export async function getErrorLogs(filters?: {
  errorType?: string;
  resolved?: boolean;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const { desc, eq, and, gte, lte } = await import('drizzle-orm');
    
    const conditions: any[] = [];
    
    if (filters?.errorType) {
      conditions.push(eq(errorLogs.errorType, filters.errorType));
    }
    if (filters?.resolved !== undefined) {
      conditions.push(eq(errorLogs.resolved, filters.resolved ? 1 : 0));
    }
    if (filters?.userId) {
      conditions.push(eq(errorLogs.userId, filters.userId));
    }
    if (filters?.startDate) {
      conditions.push(gte(errorLogs.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(errorLogs.createdAt, filters.endDate));
    }
    
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    
    const query = db.select().from(errorLogs);
    
    if (conditions.length > 0) {
      return await query
        .where(and(...conditions))
        .orderBy(desc(errorLogs.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await query
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return [];
  }
}
