import IORedis from "ioredis";

// Both clients below point at the same self-hosted Redis (see REDIS_URL),
// reached over TLS (rediss://) with a self-signed cert pinned via
// REDIS_TLS_CA — this replaced Upstash, whose REST client this module used
// to wrap. Kept as two separate ioredis instances (not one shared
// connection) because they need different failure semantics: BullMQ's
// connection must retry indefinitely on a blocking command
// (maxRetriesPerRequest: null) or jobs get lost, while the security/rate
// limiter connection must fail FAST so `safeRedisOperation`'s fail-open
// catch actually triggers instead of the request hanging.
function resolveRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!redisUrl) {
    if (process.env.NODE_ENV === "development") {
      return "redis://localhost:6379";
    }
    throw new Error(
      "Missing REDIS_URL environment variable for production."
    );
  }
  return redisUrl;
}

function buildTlsOption() {
  const ca = process.env.REDIS_TLS_CA;
  if (!ca) return undefined;
  // servername lets the on-host worker dial the internal LAN IP (faster,
  // never touches the public internet) while still validating against the
  // cert's real hostname SAN — TLS checks the cert against `servername`,
  // not the socket's actual peer address.
  return {
    ca: ca.replace(/\\n/g, "\n"), // support the cert stored with literal \n escapes
    rejectUnauthorized: true,
    servername: process.env.REDIS_TLS_SERVERNAME || "redis.ethicvoice.co",
  };
}

// IORedis configuration for BullMQ
const createIORedisConnection = () => {
  const redisUrl = resolveRedisUrl();
  console.log(
    "✅ Using Redis for BullMQ:",
    redisUrl.replace(/\/\/.*@/, "//***@")
  );
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    tls: buildTlsOption(),
  });
};

// IORedis configuration for security/rate-limiter data — short retry
// budget so a genuine Redis outage fails fast (fail-open) instead of
// hanging requests. Offline queueing stays ON (the default): a real TLS
// handshake takes longer than "instant", so a command fired right after
// connecting needs somewhere to wait — with it disabled, that first
// command rejects immediately with "Stream isn't writeable" before the
// connection even has a chance to come up (confirmed against the actual
// worker container, not just in theory). maxRetriesPerRequest bounds how
// long a queued command waits before giving up if Redis is truly down.
const createAppRedisConnection = () => {
  const redisUrl = resolveRedisUrl();
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    tls: buildTlsOption(),
  });
};

// Security data Redis client (rate limiting, idempotency locks, etc.)
export const appRedis = createAppRedisConnection();

// BullMQ Redis connection
export const queueRedisConnection = createIORedisConnection();

// Test connections
export const testRedisConnections = async () => {
  try {
    await appRedis.ping();
    console.log("✅ App Redis connection successful");

    await queueRedisConnection.ping();
    console.log("✅ Redis connection for BullMQ successful");

    return { app: true, queue: true };
  } catch (error) {
    console.error("❌ Redis connection test failed:", error);
    return { app: false, queue: false };
  }
};

// Graceful shutdown
export const closeRedisConnections = async () => {
  try {
    await queueRedisConnection.quit();
    await appRedis.quit();
    console.log("Redis connections closed gracefully");
  } catch (error) {
    console.error("Error closing Redis connections:", error);
  }
};
