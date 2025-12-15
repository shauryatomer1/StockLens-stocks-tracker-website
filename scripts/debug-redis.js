
const Redis = require('ioredis');

async function testConnection() {
    console.log('Testing Redis Connection...');

    if (!process.env.REDIS_URL) {
        console.error('Error: REDIS_URL environment variable is not defined.');
        process.exit(1);
    }

    // Mask the URL for logging purposes (hide password if present)
    const maskedUrl = process.env.REDIS_URL.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to: ${maskedUrl}`);

    const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1, // Fail fast for testing
        retryStrategy: (times) => {
            if (times > 3) {
                return null; // Stop retrying after 3 attempts
            }
            return Math.min(times * 50, 2000);
        }
    });

    try {
        console.log('Sending PING...');
        const result = await redis.ping();
        console.log(`Response: ${result}`);

        console.log('Setting test key...');
        await redis.set('stocklens_debug_key', 'connected');

        console.log('Getting test key...');
        const value = await redis.get('stocklens_debug_key');
        console.log(`Value: ${value}`);

        if (value === 'connected') {
            console.log('SUCCESS: Redis connection verified.');
        } else {
            console.error('FAILURE: Retrieved value does not match.');
        }

    } catch (error) {
        console.error('CONNECTION FAILED:', error);
    } finally {
        await redis.quit();
        process.exit(0);
    }
}

testConnection();
