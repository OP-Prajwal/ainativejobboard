import express from 'express';
import cors from 'cors';
import { config } from './config';
import { connectDB } from './db';
import { AuthService } from './services/AuthService';
import { validateInstallationToken } from './middleware/auth';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/v1/installations/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/v1/installations/register', async (req, res) => {
    try {
        const { installation_id, domain } = req.body;

        if (!installation_id) {
            return res.status(400).json({ error: 'installation_id is required' });
        }

        const result = await AuthService.registerInstallation({ installation_id, domain });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Protected Route Example
app.get('/api/v1/plugin/config', validateInstallationToken, (req, res) => {
    res.json({
        can_run_ai: true,
        features: ['decomposition', 'rendering']
    });
});

// Start
app.listen(config.port, async () => {
    console.log(`Backend service running on port ${config.port}`);
    await connectDB();
});
