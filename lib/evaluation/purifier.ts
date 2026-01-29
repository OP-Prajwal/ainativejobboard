
/**
 * Phase 1: Deterministic Purification
 * 
 * Rules:
 * - Remove auto-generated files (lockfiles, dist, builds)
 * - Remove config files (json, yaml, env)
 * - Remove assets (images, fonts)
 * - Keep only "Core Logic" (ts, py, go, rs, etc.)
 */

const IGNORED_EXTENSIONS = new Set([
    'json', 'lock', 'md', 'txt', 'yml', 'yaml', 'xml', 'csv', 'png', 'jpg', 'svg', 'ico', 'css', 'scss', 'html', 'sql'
]);

const IGNORED_PATHS = [
    'node_modules', 'dist', 'build', '.git', '.github', 'coverage', 'test', 'tests', '__tests__'
];

const IGNORED_FILES = new Set([
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'cargo.lock', '.gitignore', '.env', '.env.example'
]);

export function isNoise(filename: string): boolean {
    const parts = filename.split('/');
    const name = parts[parts.length - 1];
    const ext = name.split('.').pop()?.toLowerCase();

    // 1. Exact File Match
    if (IGNORED_FILES.has(name)) return true;

    // 2. Extension Match
    if (ext && IGNORED_EXTENSIONS.has(ext)) return true;

    // 3. Path Match (Directories)
    if (IGNORED_PATHS.some(path => filename.includes(`/${path}/`) || filename.startsWith(`${path}/`))) return true;

    // 4. Dotfiles (Config)
    if (name.startsWith('.') && name !== '.gitignore') return true; // .eslintrc, .prettierrc

    return false;
}

export function calculateStructuralDepth(patch: string | undefined): number {
    if (!patch) return 0;

    // Heuristic: Count "structural" keywords in the diff
    // This implies actual logic change, not just copy updates
    const keywords = ['function', 'class', 'interface', 'if', 'else', 'for', 'while', 'return', 'import', 'export'];
    let score = 0;

    const lines = patch.split('\n');
    for (const line of lines) {
        // Only count added/modified lines
        if (line.startsWith('+') && !line.startsWith('+++')) {
            const content = line.substring(1).trim();
            if (keywords.some(k => content.includes(k))) {
                score += 1;
            }
        }
    }

    return score;
}
