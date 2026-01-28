const TOKEN_KEY = 'finalround_plugin_token';

export class TokenManager {
    static async ensureToken(installationId: string): Promise<string> {
        try {
            const existingToken = localStorage.getItem(TOKEN_KEY);
            if (existingToken) {
                return existingToken;
            }

            // REAL REGISTRATION FLOW
            // We assume the backend is hosted by the Next.js app on localhost:3000
            const BACKEND_URL = 'http://localhost:3000/api/v1';
            console.log('[FinalRoundPlugin] Registering installation...', { installationId, apiUrl: BACKEND_URL });

            const response = await fetch(`${BACKEND_URL}/installations/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    installation_id: installationId,
                    domain: window.location.hostname
                })
            });

            if (!response.ok) {
                throw new Error(`Registration failed: ${response.statusText}`);
            }

            const data = await response.json();
            const token = data.installation_token;

            localStorage.setItem(TOKEN_KEY, token);
            return token;
        } catch (e) {
            console.error('[FinalRoundPlugin] Token registration failed', e);
            throw e;
        }
    }

    static getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }
}
