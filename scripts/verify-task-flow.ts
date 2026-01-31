import { Phase, ProjectState, PriorPhaseArtifacts, JobOutcomeBundle } from '../lib/task-allocation/types';
import { allocateNextTask } from '../lib/task-allocation/allocator';

async function simulateFullAssessment() {
    console.log("--- STARTING SEQUENTIAL TASK ALLOCATION SIMULATION ---\n");

    const job: JobOutcomeBundle = {
        businessGoals: ["Build a high-throughput payment gateway", "Ensure 99.99% uptime"],
        successCriteria: ["Latency < 200ms", "Zero data loss"],
        failureConditions: ["Double spending", "Service downtime > 5 mins"]
    };

    let currentState: ProjectState = {
        phase: Phase.IDEAL,
        technicalDebt: 0,
        activeConstraints: ["Initial Phase: Design the ideal solution."],
        decisionLog: [],
        systemShape: "A clean slate."
    };

    let priorArtifacts: PriorPhaseArtifacts = {
        phase: Phase.IDEAL,
        code: "// Initial skeleton code",
        docs: "Initial system design document",
        decisions: ["Use Microservices architecture"]
    };

    // Simulate through all phases
    for (let i = 1; i <= 7; i++) {
        console.log(`>>> ALLOCATING PHASE ${currentState.phase} prompt...`);
        const { updatedState, taskPrompt } = allocateNextTask(currentState, priorArtifacts, job);

        console.log(`\n--- PHASE ${updatedState.phase} PROMPT ---`);
        console.log(taskPrompt);
        console.log("-------------------------------------------\n");

        console.log(">>> UPDATED STATE:");
        console.log(JSON.stringify(updatedState, null, 2));
        console.log("\n===========================================\n");

        // Prepare for next iteration (simulating candidate work)
        currentState = updatedState;
        priorArtifacts = {
            phase: updatedState.phase,
            code: priorArtifacts.code + `\n// Work from phase ${updatedState.phase}`,
            docs: priorArtifacts.docs + `\nDocumentation for phase ${updatedState.phase}`,
            decisions: [`Adopted decision for phase ${updatedState.phase}`]
        };

        if (i === 7) break;
    }

    console.log("--- SIMULATION COMPLETE ---");
}

simulateFullAssessment().catch(console.error);
