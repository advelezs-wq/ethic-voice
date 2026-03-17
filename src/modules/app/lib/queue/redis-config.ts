import { Redis } from "@upstash/redis";
import IORedis from "ioredis";

// Upstash Redis configuration for production
const createUpstashRedis = () => {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn(
      "⚠️ Missing Upstash Redis REST configuration. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables."
    );
    console.warn("📝 Get these from: https://console.upstash.com/redis");
    throw new Error(
      "Missing Upstash Redis configuration. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables."
    );
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
};

// IORedis configuration for BullMQ (using Upstash Redis TCP endpoint)
const createIORedisConnection = () => {
  const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;

  if (!redisUrl) {
    // Only fallback to local Redis in development
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️ No Upstash Redis URL found, falling back to local Redis for development"
      );
      return new IORedis({
        host: "localhost",
        port: 6379,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
    } else {
      console.error(
        "❌ Missing Upstash Redis URL for production. Please set UPSTASH_REDIS_URL environment variable."
      );
      console.error(
        "📝 Get this from: https://console.upstash.com/redis (TCP endpoint)"
      );
      throw new Error(
        "Missing Upstash Redis URL for production. Please set UPSTASH_REDIS_URL environment variable."
      );
    }
  }

  console.log(
    "✅ Using Upstash Redis for BullMQ:",
    redisUrl.replace(/\/\/.*@/, "//***@")
  );
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
};

// Security data Redis client (for rate limiting, etc.)
export const upstashRedis = createUpstashRedis();

// BullMQ Redis connection
export const queueRedisConnection = createIORedisConnection();

// Test connections
export const testRedisConnections = async () => {
  try {
    // Test Upstash Redis REST API
    await upstashRedis.ping();
    console.log("✅ Upstash Redis REST connection successful");

    // Test IORedis connection for BullMQ
    await queueRedisConnection.ping();
    console.log("✅ Redis connection for BullMQ successful");

    return { upstash: true, queue: true };
  } catch (error) {
    console.error("❌ Redis connection test failed:", error);
    return { upstash: false, queue: false };
  }
};

// Graceful shutdown
export const closeRedisConnections = async () => {
  try {
    await queueRedisConnection.quit();
    console.log("Redis connections closed gracefully");
  } catch (error) {
    console.error("Error closing Redis connections:", error);
  }
};
