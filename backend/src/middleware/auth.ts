import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

export const validateInstallationToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['x-plugin-token'] as string;

    if (!token) {
        return res.status(401).json({ error: 'Missing X-Plugin-Token header' });
    }

    const isValid = await AuthService.validateToken(token);

    if (!isValid) {
        return res.status(403).json({ error: 'Invalid or revoked token' });
    }

    next();
};
