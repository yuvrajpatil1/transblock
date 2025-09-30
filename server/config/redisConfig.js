// const Redis = require("ioredis");

// const redis = new Redis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD || null,
//   db: process.env.REDIS_DB || 0,
//   retryDelayOnFailover: 100,
//   maxRetriesPerRequest: 3,
//   lazyConnect: true,
// });

// redis.on("connect", () => {
//   console.log("Connected to Redis");
// });

// redis.on("error", (err) => {
//   console.error("Redis connection error:", err);
// });
// module.exports = redis;

// server/config/redisConfig.js
const Redis = require("ioredis");

let redis;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redis.on("connect", () => {
    console.log("Redis connected successfully");
  });

  redis.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  redis.on("ready", () => {
    console.log("Redis is ready");
  });
} catch (error) {
  console.error("Failed to initialize Redis:", error);
  redis = null;
}

module.exports = redis;
