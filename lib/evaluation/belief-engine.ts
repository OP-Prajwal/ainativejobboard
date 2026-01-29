import { KnowledgeGraph } from './knowledge-graph';

export type Belief = {
    signal: string;
    alpha: number; // Successes / Positive Evidence
    beta: number;  // Failures / Negative Evidence (or Prior Drag)
    mean: number;  // Expected Value (alpha / alpha + beta)
    uncertainty: number; // 1 / (alpha + beta) -- approximate
};

export class BeliefEngine {
    beliefs: Map<string, Belief> = new Map();

    // Initialize from GitHub Evidence (Weak Priors)
    initializeFromGraph(kg: KnowledgeGraph, candidateId: string) {
        const signals = kg.getCandidateSignals(candidateId);

        signals.forEach((data, signalId) => {
            // Mapping Graph Weight to Belief Priors
            // GitHub evidence is "positive-only", so we add to Alpha.
            // But it is "Weak", so we scale it down.
            // Weight 1.0 => Alpha +0.5 (just an example heuristic)

            const priorAlpha = 1.0; // Base prior
            const priorBeta = 1.0;  // Base prior

            // Logarithmic scaling for GitHub evidence to prevent domination
            // Even 100 commits shouldn't give 100% confidence.
            const evidenceWeight = Math.log(data.totalWeight + 1);

            this.beliefs.set(signalId, {
                signal: signalId,
                alpha: priorAlpha + evidenceWeight,
                beta: priorBeta, // No negative evidence from GitHub usually
                mean: 0,
                uncertainty: 0
            });

            this.recalculate(signalId);
        });
    }

    // Phase 6: Update with Real Task Evidence
    updateWithTaskOutcome(signalId: string, success: boolean, confidence: number) {
        const current = this.beliefs.get(signalId) || { signal: signalId, alpha: 1, beta: 1, mean: 0.5, uncertainty: 0.5 };

        if (success) {
            current.alpha += confidence; // Strong evidence adds directly
        } else {
            current.beta += confidence;
        }

        this.beliefs.set(signalId, current);
        this.recalculate(signalId);
    }

    private recalculate(signalId: string) {
        const b = this.beliefs.get(signalId)!;
        const total = b.alpha + b.beta;
        b.mean = b.alpha / total;
        // Simple uncertainty metric: High total evidence = Low uncertainty
        b.uncertainty = 1 / Math.sqrt(total);
    }

    getReport() {
        return Array.from(this.beliefs.values()).map(b => ({
            Signal: b.signal.replace('signal:', ''),
            'Capability Score': b.mean.toFixed(2),
            'Uncertainty': b.uncertainty.toFixed(2),
            'Evidence Count': (b.alpha + b.beta - 2).toFixed(1) // Subtract priors
        }));
    }
}
