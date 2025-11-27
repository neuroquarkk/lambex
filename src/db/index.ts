import { PrismaClient } from 'generated/prisma/client';
import { createClient } from 'redis';
import { config } from 'src/config';

export const prisma = new PrismaClient();
export const redis = createClient({
    url: config.REDIS_URL,
});

redis.on('error', (error) => console.error('Redis client error:', error));

export async function checkConn() {
    try {
        await checkRedis();
        await prisma.$connect();
        console.log('Database connection successful');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
}

export async function checkRedis() {
    try {
        await redis.connect();
        await redis.ping();
        console.log('Redis connection successful');
    } catch (error) {
        console.error('Redis connection error:', error);
        process.exit(1);
    }
}
