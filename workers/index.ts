// workers/index.ts
import { createSubmissionWorker, createEmailWorker, scheduleEmailChecks, checkQueueHealth } from '@/modules/app/lib/queue/queue-manager';
import { testRedisConnections, closeRedisConnections } from '@/modules/app/lib/queue/redis-config';

async function startWorkers() {
  console.log('🚀 Starting EthicLine Background Workers...');

  try {
    // Test Redis connections first
    const connectionTest = await testRedisConnections();
    if (!connectionTest.upstash || !connectionTest.queue) {
      console.error('❌ Redis connections failed. Exiting...');
      process.exit(1);
    }

    console.log('✅ Redis connections established');

    // Create workers
    const submissionWorker = createSubmissionWorker();
    const emailWorker = createEmailWorker();

    console.log('🔄 Workers created and starting...');

    // Schedule email checks (when Gmail is configured)
    await scheduleEmailChecks();

    // Health check interval
    const healthCheckInterval = setInterval(async () => {
      try {
        const health = await checkQueueHealth();
        if (health.healthy) {
          console.log('💚 Queue health check: HEALTHY');
        } else {
          console.warn('⚠️ Queue health check: UNHEALTHY', health.details || health.error);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, 30000); // Every 30 seconds

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      // Clear health check interval
      clearInterval(healthCheckInterval);
      
      try {
        // Close workers
        console.log('🔄 Closing workers...');
        await submissionWorker.close();
        await emailWorker.close();
        
        // Close Redis connections
        console.log('🔄 Closing Redis connections...');
        await closeRedisConnections();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Setup signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    console.log('✅ EthicLine Background Workers started successfully');
    console.log('📊 Workers Status:');
    console.log('   - Submission Worker: Running (concurrency: 3)');
    console.log('   - Email Worker: Running (concurrency: 1)');
    console.log('   - Health Checks: Every 30 seconds');
    console.log('   - Redis: Connected to Upstash');
    
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Start the workers
startWorkers();
