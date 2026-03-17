import { RateLimiter } from 'limiter';
import { NextRequest } from 'next/server';
import { upstashRedis } from '@/modules/app/lib/queue/redis-config';

// Rate limiters for different endpoints
const rateLimiters = {
  form: new RateLimiter({ tokensPerInterval: 5, interval: 'minute' }),
  email: new RateLimiter({ tokensPerInterval: 10, interval: 'minute' }),
  upload: new RateLimiter({ tokensPerInterval: 20, interval: 'minute' }),
  general: new RateLimiter({ tokensPerInterval: 100, interval: 'minute' }),
};

// Redis keys for persistence
const REDIS_KEYS = {
  BLOCKED_IPS: 'security:blocked_ips',
  SUSPICIOUS_IPS: 'security:suspicious_ips',
  WHITELISTED_IPS: 'security:whitelisted_ips',
  RECENT_ATTACKS: 'security:recent_attacks',
  RECENT_ACTIVITIES: 'security:recent_activities',
  RATE_LIMIT_STATS: 'security:rate_limit_stats',
  IP_REQUEST_STATS: 'security:ip_request_stats',
  REQUEST_COUNTS: 'security:request_counts',
};

// Store request counts per IP/email (keeping in memory for performance)
const requestCounts = new Map<string, { count: number; lastReset: number; suspicious: boolean }>();

// Suspicious patterns detection
const suspiciousPatterns = {
  rapidRequests: 10, // More than 10 requests in 30 seconds
  timeWindow: 30000, // 30 seconds
  maxDailySubmissions: 50, // Max submissions per day per IP
};

export interface RateLimitConfig {
  type: 'form' | 'email' | 'upload' | 'general';
  identifier: string; // IP or email
  additionalChecks?: {
    userAgent?: string;
    referrer?: string;
    contentLength?: number;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  requiresCaptcha: boolean;
  reason?: string;
  blockDuration?: number;
}

export class SecurityManager {
  private static instance: SecurityManager;

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Helper method to safely interact with Redis
  private async safeRedisOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error('[SECURITY] Redis operation failed:', error);
      return fallback;
    }
  }

  async checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    const { type, identifier, additionalChecks } = config;
    
    // Check if IP is blocked (from Redis)
    const isBlocked = await this.safeRedisOperation(
      async () => {
        const result = await upstashRedis.sismember(REDIS_KEYS.BLOCKED_IPS, identifier);
        return result === 1;
      },
      false
    );

    if (isBlocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000, // 1 hour
        requiresCaptcha: true,
        reason: 'IP temporarily blocked',
        blockDuration: 3600000,
      };
    }

    // Check if IP is whitelisted (from Redis)
    const isWhitelisted = await this.safeRedisOperation(
      async () => {
        const result = await upstashRedis.sismember(REDIS_KEYS.WHITELISTED_IPS, identifier);
        return result === 1;
      },
      false
    );

    if (isWhitelisted) {
      return {
        allowed: true,
        remaining: 1000,
        resetTime: Date.now() + 60000,
        requiresCaptcha: false,
      };
    }

    const limiter = rateLimiters[type];
    const allowed = await limiter.tryRemoveTokens(1);

    // Track request patterns
    this.trackRequest(identifier, additionalChecks);
    
    // Check for suspicious behavior
    const suspicious = this.detectSuspiciousBehavior(identifier, additionalChecks);
    const requiresCaptcha = suspicious || await this.isSuspiciousIP(identifier);

    return {
      allowed: allowed,
      remaining: limiter.getTokensRemaining(),
      resetTime: Date.now() + (limiter.getTokensRemaining() === 0 ? 60000 : 0),
      requiresCaptcha,
      reason: !allowed ? 'Rate limit exceeded' : undefined,
    };
  }

  private async isSuspiciousIP(ip: string): Promise<boolean> {
    return this.safeRedisOperation(
      async () => {
        const result = await upstashRedis.sismember(REDIS_KEYS.SUSPICIOUS_IPS, ip);
        return result === 1;
      },
      false
    );
  }

  private trackRequest(identifier: string, additionalChecks?: RateLimitConfig['additionalChecks']) {
    const now = Date.now();
    const existing = requestCounts.get(identifier);

    if (!existing || now - existing.lastReset > suspiciousPatterns.timeWindow) {
      requestCounts.set(identifier, {
        count: 1,
        lastReset: now,
        suspicious: false,
      });
    } else {
      existing.count++;
      
      // Check for rapid requests
      if (existing.count > suspiciousPatterns.rapidRequests) {
        existing.suspicious = true;
        this.addSuspiciousIP(identifier);
      }
    }

    // Use additionalChecks for enhanced tracking
    if (additionalChecks?.userAgent) {
      // Enhanced tracking data available
    }
  }

  private detectSuspiciousBehavior(
    identifier: string, 
    additionalChecks?: RateLimitConfig['additionalChecks']
  ): boolean {
    const data = requestCounts.get(identifier);
    
    if (!data) return false;

    // Rapid request pattern
    if (data.count > suspiciousPatterns.rapidRequests) {
      return true;
    }

    // Check user agent patterns
    if (additionalChecks?.userAgent) {
      const ua = additionalChecks.userAgent.toLowerCase();
      const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'postman'];
      if (botPatterns.some(pattern => ua.includes(pattern))) {
        return true;
      }
    }

    // Check for missing or suspicious referrer
    if (additionalChecks?.referrer === undefined || additionalChecks?.referrer === '') {
      // Missing referrer might be suspicious for form submissions
      return true;
    }

    return false;
  }

  async blockIP(ip: string, duration: number = 3600000) {
    // Add to Redis set
    await this.safeRedisOperation(
      () => upstashRedis.sadd(REDIS_KEYS.BLOCKED_IPS, ip),
      null
    );

    this.logAttack(ip, 'IP Blocked', `Automatically blocked for ${duration}ms`);
    
    // Auto-unblock after duration
    setTimeout(async () => {
      await this.unblockIP(ip);
    }, duration);
  }

  async unblockIP(ip: string): Promise<boolean> {
    try {
      const result = await upstashRedis.srem(REDIS_KEYS.BLOCKED_IPS, ip);
      return result > 0;
    } catch (error) {
      console.error('[SECURITY] Error unblocking IP:', error);
      return false;
    }
  }

  async addToWhitelist(ip: string) {
    await this.safeRedisOperation(
      () => upstashRedis.sadd(REDIS_KEYS.WHITELISTED_IPS, ip),
      null
    );
  }

  async removeFromWhitelist(ip: string) {
    await this.safeRedisOperation(
      () => upstashRedis.srem(REDIS_KEYS.WHITELISTED_IPS, ip),
      null
    );
  }

  async addSuspiciousIP(ip: string) {
    await this.safeRedisOperation(
      () => upstashRedis.sadd(REDIS_KEYS.SUSPICIOUS_IPS, ip),
      null
    );
  }

  async getWhitelistedIPs(): Promise<string[]> {
    return this.safeRedisOperation(
      () => upstashRedis.smembers(REDIS_KEYS.WHITELISTED_IPS),
      []
    );
  }

  async getSuspiciousIPs(): Promise<string[]> {
    return this.safeRedisOperation(
      () => upstashRedis.smembers(REDIS_KEYS.SUSPICIOUS_IPS),
      []
    );
  }

  async getBlockedIPs(): Promise<string[]> {
    return this.safeRedisOperation(
      () => upstashRedis.smembers(REDIS_KEYS.BLOCKED_IPS),
      []
    );
  }

  async getRecentAttacks(): Promise<Array<{
    ip: string;
    timestamp: string;
    type: string;
    reason: string;
  }>> {
    const attacks = await this.safeRedisOperation(
      async () => {
        const rawAttacks = await upstashRedis.lrange(REDIS_KEYS.RECENT_ATTACKS, 0, 49);
        return rawAttacks.map(attack => JSON.parse(attack));
      },
      []
    );
    
    return attacks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getRecentActivities(): Promise<Array<{
    ip: string;
    timestamp: string;
    type: string;
    details: string;
  }>> {
    const activities = await this.safeRedisOperation(
      async () => {
        const rawActivities = await upstashRedis.lrange(REDIS_KEYS.RECENT_ACTIVITIES, 0, 49);
        return rawActivities.map(activity => JSON.parse(activity));
      },
      []
    );
    
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getRateLimitStats(): Promise<{
    formSubmissions: number;
    emailAttempts: number;
    captchaRequired: number;
    captchaPassed: number;
  }> {
    return this.safeRedisOperation(
      async () => {
        const stats = await upstashRedis.hgetall(REDIS_KEYS.RATE_LIMIT_STATS);
        if (!stats || typeof stats !== 'object') {
          return {
            formSubmissions: 0,
            emailAttempts: 0,
            captchaRequired: 0,
            captchaPassed: 0,
          };
        }
        return {
          formSubmissions: parseInt(String(stats.formSubmissions || '0')),
          emailAttempts: parseInt(String(stats.emailAttempts || '0')),
          captchaRequired: parseInt(String(stats.captchaRequired || '0')),
          captchaPassed: parseInt(String(stats.captchaPassed || '0')),
        };
      },
      {
        formSubmissions: 0,
        emailAttempts: 0,
        captchaRequired: 0,
        captchaPassed: 0,
      }
    );
  }

  // Log security events to Redis
  async logAttack(ip: string, type: string, reason: string) {
    const attack = {
      ip,
      timestamp: new Date().toISOString(),
      type,
      reason,
    };
    
    await this.safeRedisOperation(
      async () => {
        await upstashRedis.lpush(REDIS_KEYS.RECENT_ATTACKS, JSON.stringify(attack));
        // Keep only last 1000 attacks
        await upstashRedis.ltrim(REDIS_KEYS.RECENT_ATTACKS, 0, 999);
      },
      null
    );
  }

  // Log legitimate activities (for activity tracking)
  async logActivity(ip: string, type: string, details: string) {
    const activity = {
      ip,
      timestamp: new Date().toISOString(),
      type,
      details,
    };
    
    await this.safeRedisOperation(
      async () => {
        await upstashRedis.lpush(REDIS_KEYS.RECENT_ACTIVITIES, JSON.stringify(activity));
        // Keep only last 1000 activities
        await upstashRedis.ltrim(REDIS_KEYS.RECENT_ACTIVITIES, 0, 999);
      },
      null
    );
  }

  // Update rate limit stats in Redis
  async updateStats(type: 'form' | 'email' | 'captcha_required' | 'captcha_passed') {
    const fieldMap = {
      form: 'formSubmissions',
      email: 'emailAttempts',
      captcha_required: 'captchaRequired',
      captcha_passed: 'captchaPassed',
    };

    const field = fieldMap[type];
    if (field) {
      await this.safeRedisOperation(
        () => upstashRedis.hincrby(REDIS_KEYS.RATE_LIMIT_STATS, field, 1),
        null
      );
    }
  }

  // Track IP requests for visualization (using Redis with TTL)
  async trackIPRequest(ip: string, type: 'form' | 'email' | 'upload' | 'general') {
    const key = `${REDIS_KEYS.IP_REQUEST_STATS}:${ip}`;
    const now = Date.now();
    
    await this.safeRedisOperation(
      async () => {
        // Get existing data
        const existing = await upstashRedis.hgetall(key) || {};
        
        const data = {
          count: parseInt(String(existing.count || '0')) + 1,
          lastSeen: now,
          [`types_${type}`]: parseInt(String(existing[`types_${type}`] || '0')) + 1,
        };

        // Update data
        await upstashRedis.hset(key, data);
        
        // Set TTL for 24 hours
        await upstashRedis.expire(key, 86400);
      },
      null
    );
  }

  // Get IP request statistics for dashboard
  async getIPRequestStats(): Promise<Array<{
    ip: string;
    count: number;
    lastSeen: number;
    types: Record<string, number>;
  }>> {
    return this.safeRedisOperation(
      async () => {
        // Get all IP keys
        const keys = await upstashRedis.keys(`${REDIS_KEYS.IP_REQUEST_STATS}:*`);
        
        const stats = [];
        for (const key of keys) {
          const ip = key.replace(`${REDIS_KEYS.IP_REQUEST_STATS}:`, '');
          const data = await upstashRedis.hgetall(key);
          
          if (data && typeof data === 'object' && data.count) {
            const types: Record<string, number> = {};
            
            // Extract types data
            Object.keys(data).forEach(field => {
              if (field.startsWith('types_')) {
                const type = field.replace('types_', '');
                types[type] = parseInt(String(data[field] || '0'));
              }
            });

            stats.push({
              ip,
              count: parseInt(String(data.count || '0')),
              lastSeen: parseInt(String(data.lastSeen || '0')),
              types,
            });
          }
        }

        // Sort by count (highest first)
        return stats.sort((a, b) => b.count - a.count);
      },
      []
    );
  }

  // Manual block IP (different from auto-block, no timeout)
  async manualBlockIP(ip: string, reason: string = 'Manually blocked by admin'): Promise<boolean> {
    const isAlreadyBlocked = await this.safeRedisOperation(
      async () => {
        const result = await upstashRedis.sismember(REDIS_KEYS.BLOCKED_IPS, ip);
        return result === 1;
      },
      false
    );

    if (isAlreadyBlocked) {
      return false; // Already blocked
    }
    
    await this.safeRedisOperation(
      () => upstashRedis.sadd(REDIS_KEYS.BLOCKED_IPS, ip),
      null
    );
    
    this.logAttack(ip, 'Manual Block', reason);
    return true;
  }

  // Clear old tracking data periodically (Redis handles TTL automatically)
  cleanup() {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (const [identifier, data] of requestCounts.entries()) {
      if (now - data.lastReset > dayInMs) {
        requestCounts.delete(identifier);
      }
    }
  }
}

// Helper function to get client IP from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  let ip = 'unknown';
  
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (realIP) {
    ip = realIP;
  } else if (clientIP) {
    ip = clientIP;
  } else {
    // For development, try to get localhost IP
    const host = request.headers.get('host');
    if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      ip = '127.0.0.1';
    }
  }
  
  return ip;
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance(); 