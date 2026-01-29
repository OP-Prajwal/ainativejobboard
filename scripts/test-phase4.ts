import { KnowledgeGraph } from '../lib/evaluation/knowledge-graph';
import { BeliefEngine } from '../lib/evaluation/belief-engine';

function main() {
    console.log("--- Testing Phase 4: Belief Engine ---");

    // 1. Setup Graph with GitHub Evidence
    const kg = new KnowledgeGraph();
    kg.addNode('candidate:c1', 'candidate');
    kg.addNode('signal:python', 'signal');

    // Simulate: 10 commits suggesting Python skill
    for (let i = 0; i < 10; i++) {
        kg.addNode(`commit:${i}`, 'artifact');
        kg.addEdge('candidate:c1', `commit:${i}`, 'created', 1.0);
        kg.addEdge(`commit:${i}`, 'signal:python', 'suggests', 0.8);
    }

    // 2. Initialize Engine
    const engine = new BeliefEngine();
    engine.initializeFromGraph(kg, 'candidate:c1');

    console.log("\nInitial State (GitHub Evidence Only):");
    console.table(engine.getReport());

    // 3. Simulate Real Task Update (Ground Truth)
    console.log("\nUpdating with Real Task: PASSED Python Task (High Confidence)...");
    engine.updateWithTaskOutcome('signal:python', true, 2.0); // Real task has high weight (2.0)
    console.table(engine.getReport());

    console.log("\nUpdating with Real Task: FAILED Python Task (High Confidence)...");
    engine.updateWithTaskOutcome('signal:python', false, 3.0); // Failed hard
    console.table(engine.getReport());

    // Observation: GitHub gave it a head start, but the failures should drag it down efficiently.
}

main();
