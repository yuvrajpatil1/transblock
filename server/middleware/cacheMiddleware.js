// const CacheUtils = require("../utils/cacheUtils");

// const cacheMiddleware = (keyGenerator, ttl = 3600) => {
//   return async (req, res, next) => {
//     try {
//       const cacheKey =
//         typeof keyGenerator === "function" ? keyGenerator(req) : keyGenerator;

//       const cachedData = await CacheUtils.get(cacheKey);

//       if (cachedData) {
//         return res.send(cachedData);
//       }

//       const originalSend = res.send;

//       res.send = function (data) {
//         if (data && data.success) {
//         }
//         return originalSend.call(this, data);
//       };

//       next();
//     } catch (error) {
//       console.error("Cache middleware error:", error);
//       next();
//     }
//   };
// };

// module.exports = cacheMiddleware;

// server/middleware/cacheMiddleware.js
const cacheUtils = require("../utils/cacheUtils");

// Cache middleware factory
const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    try {
      const key =
        typeof keyGenerator === "function" ? keyGenerator(req) : keyGenerator;

      const cachedData = await cacheUtils.get(key);

      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          cached: true,
        });
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data) {
        if (data.success && data.data) {
          cacheUtils.set(key, data.data, ttl).catch(console.error);
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

module.exports = cacheMiddleware;
