import Redis from 'ioredis';

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    throw new Error('REDIS_URL is not defined');
};

export const redis = new Redis(getRedisUrl(), {
    lazyConnect: true,
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

redis.connect().catch((err) => {
    // Connection errors are handled by the 'error' listener as well, but this prevents unhandled promise rejections on startup
    console.error('Failed to connect to Redis:', err.message);
});
