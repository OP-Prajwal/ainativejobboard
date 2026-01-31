
import { KnowledgeGraph } from './knowledge-graph';

export function ingestEnrichmentToGraph(kg: KnowledgeGraph, candidateId: string, enrichmentData: any) {
    // 1. GitHub Signals
    if (enrichmentData.github && enrichmentData.github.stats) {
        const stats = enrichmentData.github.stats;

        // Signal: Popular Languages
        if (stats.topLanguages) {
            stats.topLanguages.forEach((lang: string) => {
                const signalId = `signal:${lang.toLowerCase()}`;
                kg.addNode(signalId, 'signal', { name: lang });

                // Direct Suggestion: Candidate -> Signal
                // Weight based loosely on activity/ranking
                kg.addEdge(candidateId, signalId, 'suggests', 3.0);
            });
        }

        // Signal: High Star Count (Reputation)
        if (stats.totalStars > 50) {
            const starSignal = 'signal:open_source_reputation';
            kg.addNode(starSignal, 'signal');
            kg.addEdge(candidateId, starSignal, 'suggests', Math.log10(stats.totalStars) * 2);
        }

        // Artifacts: Recent Commit Messages
        if (stats.recentActivity) {
            stats.recentActivity.forEach((activity: any, idx: number) => {
                const artifactId = `artifact:commit:${idx}`;
                kg.addNode(artifactId, 'artifact', {
                    content: activity.message,
                    repo: activity.repo
                });

                // Candidate -> Created -> Artifact
                kg.addEdge(candidateId, artifactId, 'created', 1.0);

                // Naive Keyword Extraction (In a real system, LLM extractive)
                const message = activity.message.toLowerCase();
                const keywords = ['react', 'next', 'rust', 'optimization', 'refactor', 'test'];

                keywords.forEach(kw => {
                    if (message.includes(kw)) {
                        const sigId = `signal:${kw}`;
                        kg.addNode(sigId, 'signal');
                        kg.addEdge(artifactId, sigId, 'suggests', 1.5);
                    }
                });
            });
        }
    }

    // 2. LeetCode / Algo Signals
    if (enrichmentData.leetcode && enrichmentData.leetcode.stats) {
        const solved = enrichmentData.leetcode.stats.solvedProblems;
        if (solved > 50) {
            const algoSignal = 'signal:algorithmic_problem_solving';
            kg.addNode(algoSignal, 'signal');
            kg.addEdge(candidateId, algoSignal, 'suggests', Math.log10(solved) * 2);
        }
    }
}
