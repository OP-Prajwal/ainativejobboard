import jwt from 'jsonwebtoken';
import { prisma, redisClient } from '../db';
import { config } from '../config';

interface RegisterParams {
    installation_id: string;
    domain?: string;
}

export class AuthService {
    static async registerInstallation({ installation_id, domain }: RegisterParams) {
        try {
            // 1. Check if exists using Prisma
            const existing = await prisma.installation.findUnique({
                where: { installationId: installation_id }
            });

            if (existing && existing.installationToken) {
                return {
                    installation_id,
                    installation_token: existing.installationToken,
                    is_new: false
                };
            }

            // 2. Create New
            const token = jwt.sign(
                { installation_id, domain },
                config.jwtSecret,
                { expiresIn: '365d' }
            );

            await prisma.installation.create({
                data: {
                    installationId: installation_id,
                    domain: domain || null,
                    installationToken: token
                }
            });

            // Cache status
            if (redisClient.isOpen) {
                await redisClient.set(`installation:${installation_id}:status`, 'active', { EX: 86400 });
            }

            return {
                installation_id,
                installation_token: token,
                is_new: true
            };

        } catch (e) {
            console.error('Database Error in Auth Service:', e);
            throw new Error('Service Unavailable');
        }
    }

    static async validateToken(token: string): Promise<boolean> {
        try {
            // 1. Verify Signature
            const decoded = jwt.verify(token, config.jwtSecret) as any;
            const installId = decoded.installation_id;

            // 2. Check Cache
            if (redisClient.isOpen) {
                const cachedStatus = await redisClient.get(`installation:${installId}:status`);
                if (cachedStatus === 'active') return true;
                if (cachedStatus === 'revoked') return false;
            }

            // 3. Fallback to DB (and cache it)
            const installation = await prisma.installation.findUnique({
                where: { installationId: installId }
            });

            if (!installation || installation.status !== 'active') {
                return false;
            }

            // Re-cache
            if (redisClient.isOpen) {
                await redisClient.set(`installation:${installId}:status`, 'active', { EX: 3600 });
            }

            return true;

        } catch (e) {
            return false;
        }
    }
}
