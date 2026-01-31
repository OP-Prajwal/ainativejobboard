/**
 * Normalizes a value to the 0.0 - 1.0 range based on min and max.
 */
export function normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    const normalized = (value - min) / (max - min);
    return clamp(normalized, 0, 1);
}

/**
 * Clamps a value between a minimum and maximum.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Deterministically calculates a stability score based on string distance (simple heuristic).
 */
export function calculateStability(prev: string, curr: string): number {
    if (!prev || !curr) return 1.0;

    // Very simple check: if current contains previous, it's stable.
    // In a real engine, this would be an AST-based semantic analysis.
    if (curr.includes(prev)) return 1.0;

    const intersection = prev.split('').filter(char => curr.includes(char)).length;
    return normalize(intersection, 0, Math.max(prev.length, curr.length));
}
