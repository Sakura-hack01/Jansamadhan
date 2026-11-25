const redisClient = require('../config/redis');

/**
 * Middleware to cache API responses
 * @param {number} duration Expiration time in seconds
 */
const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        if (req.method !== 'GET' || !redisClient) {
            return next();
        }

        // Use the original URL as the cache key
        const key = `__express__${req.originalUrl || req.url}`;

        try {
            const cachedResponse = await redisClient.get(key);
            if (cachedResponse) {
                // If the response is in cache, return it immediately
                res.setHeader('X-Cache', 'HIT');
                return res.json(JSON.parse(cachedResponse));
            } else {
                res.setHeader('X-Cache', 'MISS');
                
                // Keep the original res.json function
                const originalSend = res.json;
                
                // Override it to intercept and save the data
                res.json = function (body) {
                    originalSend.call(this, body);
                    // Save response to Redis cache
                    redisClient.set(key, JSON.stringify(body), 'EX', duration);
                };
                
                next();
            }
        } catch (error) {
            console.error('Cache Retrieval Error:', error);
            // On cache failure, gracefully degrade and proceed without caching
            next();
        }
    };
};

module.exports = cacheMiddleware;
