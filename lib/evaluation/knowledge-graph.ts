
export type Node = {
    id: string;
    type: 'candidate' | 'artifact' | 'signal';
    props: Record<string, any>;
};

export type Edge = {
    source: string;
    target: string;
    relation: 'created' | 'demonstrates' | 'suggests';
    weight: number;
};

export class KnowledgeGraph {
    nodes: Map<string, Node> = new Map();
    edges: Edge[] = [];

    addNode(id: string, type: Node['type'], props: Record<string, any> = {}) {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, { id, type, props });
        }
    }

    addEdge(source: string, target: string, relation: Edge['relation'], weight: number = 1.0) {
        this.edges.push({ source, target, relation, weight });
    }

    // Phase 4 Helper: Get all signals connected to a candidate
    // Path 1: Candidate -> (created) -> Artifact -> (suggests) -> Signal
    // Path 2: Candidate -> (suggests) -> Signal (DIRECT - Added for file-based observations)
    getCandidateSignals(candidateId: string) {
        const signalMap = new Map<string, { totalWeight: number, count: number }>();

        // Path 1: Through Artifacts
        const artifacts = this.edges
            .filter(e => e.source === candidateId && e.relation === 'created')
            .map(e => ({ id: e.target, weight: e.weight }));

        for (const artifact of artifacts) {
            const signals = this.edges
                .filter(e => e.source === artifact.id && e.relation === 'suggests');

            for (const sig of signals) {
                const signalNode = this.nodes.get(sig.target);
                if (signalNode) {
                    const current = signalMap.get(signalNode.id) || { totalWeight: 0, count: 0 };
                    signalMap.set(signalNode.id, {
                        totalWeight: current.totalWeight + (sig.weight * artifact.weight),
                        count: current.count + 1
                    });
                }
            }
        }

        // Path 2: Direct Signals from Candidate (File-based observations, etc.)
        const directSignals = this.edges
            .filter(e => e.source === candidateId && e.relation === 'suggests');

        for (const sig of directSignals) {
            const signalNode = this.nodes.get(sig.target);
            if (signalNode) {
                const current = signalMap.get(signalNode.id) || { totalWeight: 0, count: 0 };
                signalMap.set(signalNode.id, {
                    totalWeight: current.totalWeight + sig.weight,
                    count: current.count + 1
                });
            }
        }

        return signalMap;
    }

    dump() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: this.edges
        };
    }
}
