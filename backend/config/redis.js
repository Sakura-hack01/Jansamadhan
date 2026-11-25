const Redis = require('ioredis');

// Connect to Redis only when REDIS_URI is configured; otherwise export a safe null client
// so deployments without Redis (e.g. Render/Railway single instance) do not spam reconnect errors.
let redisClient = null;

if (process.env.REDIS_URI) {
  redisClient = new Redis(process.env.REDIS_URI, {
    retryStrategy(times) {
      if (times > 5) return null; // Stop retrying if Redis is unreachable
      return Math.min(times * 100, 2000);
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis Client Connected');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
  });
}

module.exports = redisClient;
