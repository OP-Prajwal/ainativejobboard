import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 4000,
    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/finalround_plugin',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_do_not_use_in_prod',
    nodeEnv: process.env.NODE_ENV || 'development'
};
