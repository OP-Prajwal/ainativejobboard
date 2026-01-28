import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'FinalRoundPlugin',
            fileName: 'sdk', // produces sdk.umd.cjs and sdk.js
        },
        rollupOptions: {
            // Make sure authentication and core logic is bundled
            output: {
                extend: true,
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
    },
});
