import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'finalround_plugin_installation';

export class InstallationManager {
    static getOrCreateId(): string {
        try {
            const existing = localStorage.getItem(STORAGE_KEY);
            if (existing) {
                return existing;
            }

            const newId = uuidv4();
            localStorage.setItem(STORAGE_KEY, newId);
            return newId;
        } catch (e) {
            console.warn('[FinalRoundPlugin] LocalStorage access failed:', e);
            // Fallback for non-persistent environments
            return uuidv4();
        }
    }
}
