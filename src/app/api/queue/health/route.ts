import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isSuperAdmin } from '@/modules/core/utils/permissions';
import { checkQueueHealth, getQueueStats } from '@/modules/app/lib/queue/queue-manager';
import { testRedisConnections } from '@/modules/app/lib/queue/redis-config';

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and check if super admin
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;
    
    if (!userEmail || !isSuperAdmin(userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Test Redis connections
    const redisConnections = await testRedisConnections();
    
    // Check queue health
    const queueHealth = await checkQueueHealth();
    
    // Get queue statistics
    const queueStats = await getQueueStats();

    const healthReport = {
      status: redisConnections.upstash && redisConnections.queue && queueHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      redis: {
        upstash: redisConnections.upstash,
        queue: redisConnections.queue,
      },
      queues: {
        health: queueHealth.healthy,
        details: queueHealth.details,
        stats: queueStats,
      },
      recommendations: [] as string[],
    };

    // Add recommendations based on health status
    if (!redisConnections.upstash) {
      healthReport.recommendations.push('Configure Upstash Redis credentials (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)');
    }
    
    if (!redisConnections.queue) {
      healthReport.recommendations.push('Configure Redis connection for BullMQ (UPSTASH_REDIS_URL or REDIS_URL)');
    }
    
    if (!queueHealth.healthy) {
      healthReport.recommendations.push('Check queue worker status and restart if necessary');
    }
    
    if (queueStats.submission.failed > 5) {
      healthReport.recommendations.push('High number of failed submission jobs detected - check worker logs');
    }

    return NextResponse.json(healthReport);

  } catch (error) {
    console.error('[QUEUE] Error checking queue health:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 