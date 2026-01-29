import { KnowledgeGraph } from '../lib/evaluation/knowledge-graph';

function main() {
    console.log("--- Testing Phase 3: Knowledge Graph ---");
    const kg = new KnowledgeGraph();

    // 1. Add Candidate
    kg.addNode('candidate:octocat', 'candidate', { name: 'The Octocat' });

    // 2. Add Artifacts (Commits)
    kg.addNode('commit:123', 'artifact', { date: '2023-01-01' });
    kg.addEdge('candidate:octocat', 'commit:123', 'created', 1.0); // Recent artifact has weight 1.0

    kg.addNode('commit:456', 'artifact', { date: '2022-06-01' });
    kg.addEdge('candidate:octocat', 'commit:456', 'created', 0.5); // Old artifact has decayed weight 0.5

    // 3. Add Signals (Observations)
    kg.addNode('signal:testing', 'signal', { name: 'Testing Discipline' });
    kg.addNode('signal:refactoring', 'signal', { name: 'Refactoring' });

    // Link Artifacts to Signals
    // Commit 123 suggests Testing with high confidence (0.9)
    kg.addEdge('commit:123', 'signal:testing', 'suggests', 0.9);

    // Commit 456 suggests Refactoring (0.8) AND Testing (0.2)
    kg.addEdge('commit:456', 'signal:refactoring', 'suggests', 0.8);
    kg.addEdge('commit:456', 'signal:testing', 'suggests', 0.2);

    console.log("Graph Constructed. Nodes:", kg.nodes.size, "Edges:", kg.edges.length);

    // 4. Query Signals for Candidate
    const signals = kg.getCandidateSignals('candidate:octocat');
    console.log("\nAggregated Signals for Octocat:");
    signals.forEach((val, key) => {
        console.log(`Signal: ${key}, Aggregate Weight: ${val.totalWeight.toFixed(2)} (Count: ${val.count})`);
    });

    // Verification Logic
    // Testing: (1.0 * 0.9) + (0.5 * 0.2) = 0.9 + 0.1 = 1.0
    // Refactoring: (0.5 * 0.8) = 0.4
}

main();
