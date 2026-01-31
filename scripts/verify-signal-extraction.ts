import { Phase, ProjectState, PriorPhaseArtifacts } from '../lib/task-allocation/types';
import { extractPhaseSignals } from '../lib/evaluation/delta-extractor';
import { PhaseSignalType } from '../lib/evaluation/types';

async function simulateSignalExtraction() {
    console.log("--- STARTING SIGNAL EXTRACTION SIMULATION ---\n");

    const previous: PriorPhaseArtifacts = {
        phase: Phase.IDEAL,
        code: "class PaymentService {\n  constructor() {\n    this.db = new PostgresDB();\n }\n}",
        docs: "Architecture: Using Postgres for state.",
        decisions: ["Use Postgres"]
    };

    const current: PriorPhaseArtifacts = {
        phase: Phase.SCARCITY,
        code: "class PaymentService {\n  constructor() {\n    // Budget cut: switching to SQLite\n    this.db = new SQLiteDB();\n }\n}",
        docs: "Architecture: Using SQLite to save costs.",
        architectureNotes: "Switched to SQLite due to 70% budget cut. Maintained payment logic structure.",
        decisions: ["Use SQLite"]
    };

    const state: ProjectState = {
        phase: Phase.SCARCITY,
        technicalDebt: 10,
        activeConstraints: ["Initial Phase: Design the ideal solution.", "70% budget cut: No new external dependencies allowed."],
        decisionLog: ["Use Postgres"],
        systemShape: "A monolith with a single DB."
    };

    console.log(">>> EXTRACTING SIGNALS FROM PHASE 1 -> PHASE 2 TRANSITION...");
    const records = extractPhaseSignals(previous, current, state);

    console.log("\n--- EMITTED EVIDENCE RECORDS ---");
    records.forEach(r => {
        console.log(`[${r.metadata.signalType}] Value: ${r.value.toFixed(2)}`);
        console.log(`  Description: ${r.metadata.description}`);
    });
    console.log("--------------------------------\n");

    // Test for negative evidence (Constraint Ignore)
    const ignoreCurrent: PriorPhaseArtifacts = {
        phase: Phase.SCARCITY,
        code: "class PaymentService { /* No mention of budget or SQLite */ }",
        docs: "Doc updating failed.",
        decisions: []
    };

    console.log(">>> EXTRACTING SIGNALS (CONSTRAINT IGNORED)...");
    const negativeRecords = extractPhaseSignals(previous, ignoreCurrent, state);

    negativeRecords.forEach(r => {
        if (r.metadata.signalType === PhaseSignalType.CONSTRAINT_RESPECT) {
            console.log(`[${r.metadata.signalType}] Value: ${r.value.toFixed(2)} (Expected to be lower)`);
            console.log(`  Description: ${r.metadata.description}`);
        }
    });

    console.log("\n--- SIMULATION COMPLETE ---");
}

simulateSignalExtraction().catch(console.error);
