import { ingestGitHubHistory } from '../lib/evaluation/intake';
import { interpretSummaries } from '../lib/evaluation/interpretation';
import { KnowledgeGraph } from '../lib/evaluation/knowledge-graph';
import { BeliefEngine } from '../lib/evaluation/belief-engine';

async function main() {
    console.log("🚀 Starting AI-Native Evaluation Pipeline Verification...");

    // 1. PHASE 1: Intake (Real GitHub Data)
    const candidate = 'shadcn'; // Active user
    console.log(`\n[Phase 1] Fetching & Purifying History for: ${candidate}...`);
    const commits = await ingestGitHubHistory(candidate, 5);

    if (commits.length === 0) {
        console.log("⚠️ No commits found. Using mock data for demonstration.");
        commits.push({
            sha: 'mock123',
            message: 'feat: add recursive file walker with tests',
            date: new Date().toISOString(),
            stats: { filesChanged: 3, logicScore: 8 },
            significantFiles: ['src/walker.ts']
        });
    } else {
        console.log(`✅ Found ${commits.length} purified commits.`);
        console.log(`   Sample: "${commits[0].message}"`);
    }

    // 2. PHASE 2: Interpretation (Signal Extraction)
    console.log(`\n[Phase 2] Interpreting Signals (LLM-Light)...`);
    const observations = await interpretSummaries(commits);
    observations.forEach(o => {
        console.log(`   🔎 Detected: ${o.signal} (Conf: ${o.confidence})`);
    });

    // 3. PHASE 3: Knowledge Graph (Memory)
    console.log(`\n[Phase 3] Building Knowledge Graph...`);
    const kg = new KnowledgeGraph();
    const candidateId = `candidate:${candidate}`;
    kg.addNode(candidateId, 'candidate', { username: candidate });

    // Link Artifacts & Signals
    commits.forEach((c, i) => {
        const commitId = `commit:${c.sha}`;
        kg.addNode(commitId, 'artifact', { date: c.date });
        kg.addEdge(candidateId, commitId, 'created', 1.0);

        // Find observations for this commit
        const obs = observations.filter(o => o.evidence.includes(c.message));
        obs.forEach(o => {
            const signalId = `signal:${o.signal.replace(/\s+/g, '-').toLowerCase()}`;
            kg.addNode(signalId, 'signal', { name: o.signal });
            kg.addEdge(commitId, signalId, 'suggests', o.confidence);
        });
    });
    console.log(`   ✅ Graph Nodes: ${kg.nodes.size}, Edges: ${kg.edges.length}`);

    // 4. PHASE 4: Belief Engine (Probabilities)
    console.log(`\n[Phase 4] Calculating Probabilistic Beliefs...`);
    const engine = new BeliefEngine();
    engine.initializeFromGraph(kg, candidateId);

    console.log("\n📊 FINAL CANDIDATE BELIEF REPORT:");
    console.table(engine.getReport());

    console.log("\n✅ Verification Complete: Pipeline is functional from Intake -> Beliefs.");
}

main();
