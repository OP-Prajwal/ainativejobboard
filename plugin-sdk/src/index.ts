import { InstallationManager } from './core/InstallationManager';
import { TokenManager } from './core/TokenManager';
import { PluginRenderer } from './core/PluginRenderer';

interface InitConfig {
    apiUrl: string;
    environment: 'development' | 'production';
}

class FinalRoundPlugin {
    private static isInitialized = false;

    static async init(config: InitConfig) {
        if (this.isInitialized) return;

        console.log('[FinalRoundPlugin] Initializing...', config);

        try {
            // 1. Identity
            const installationId = InstallationManager.getOrCreateId();
            console.log('[FinalRoundPlugin] Installation ID:', installationId);

            // 2. Auth (Mock for now)
            await TokenManager.ensureToken(installationId);

            // 3. Context Lookup
            const container = document.getElementById('plugin-container');
            if (container) {
                const context = {
                    jobId: container.dataset.jobId || '',
                    jobTitle: container.dataset.jobTitle || '',
                    company: container.dataset.company || ''
                };

                // 4. Render
                if (context.jobId) {
                    PluginRenderer.mount(context);
                }
            }

            this.isInitialized = true;

        } catch (e) {
            console.error('[FinalRoundPlugin] Initialization failed:', e);
        }
    }
}

// Attach to window for global access
(window as any).FinalRoundPlugin = FinalRoundPlugin;

export default FinalRoundPlugin;
