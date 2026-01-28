import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { config } from '../config';

// Prisma Client (PostgreSQL)
export const prisma = new PrismaClient();

// Redis Client
export const redisClient = createClient({
    url: config.redisUrl
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function connectDB() {
    try {
        await redisClient.connect();
        console.log('Redis connected');
    } catch (e) {
        console.warn('Redis connection failed', e);
    }

    try {
        await prisma.$connect();
        console.log('Prisma (PostgreSQL) connected');
    } catch (e) {
        console.warn('Prisma connection failed', e);
    }
}
