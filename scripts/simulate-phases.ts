
import { generatePhaseTask, LLMTaskInput } from '../lib/task-allocation/llm-task-generator';
import { Phase, ProjectState } from '../lib/task-allocation/types';

async function runSimulation() {
    const jobDescription = "Build a high-throughput, low-latency ad-bidding engine. The system must process 1M requests per second with < 10ms latency. Data consistency is balanced with speed.";

    let currentState: ProjectState = {
        phase: Phase.IDEAL,
        technicalDebt: 0,
        activeConstraints: [],
        decisionLog: [],
        systemShape: "Undefined"
    };

    const candidateContext = {
        role: "Senior Backend Engineer",
        seniority: "senior" as const,
        priorExperience: "Distributed systems, low-latency networking"
    };

    console.log("🚀 Starting 7-Phase Simulation...\n");

    for (let i = 1; i <= 7; i++) {
        console.log(`\n-----------------------------------`);
        console.log(`🔹 GENERATING PHASE ${i}...`);
        console.log(`-----------------------------------`);

        currentState.phase = i as Phase;

        const input: LLMTaskInput = {
            jobDescription,
            candidateContext,
            projectState: currentState
        };

        let result: any;

        try {
            const rawOutput = await generatePhaseTask(input);
            const cleanOutput = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanOutput);
        } catch (error) {
            console.warn(`⚠️ LLM unavailable (Phase ${i}). Using MOCK response for simulation.`);
            result = getMockResponse(i, currentState);
        }

        console.log(`✅ Phase ${result.phase}: ${result.phaseName}`);
        console.log(`📝 Task: ${result.taskPrompt.substring(0, 100)}...`);
        console.log(`⚠️  Constraints: ${result.activeConstraints.join(', ')}`);

        // Update state for next iteration
        if (result.updatedProjectState) {
            currentState = result.updatedProjectState;
        } else {
            currentState.activeConstraints = result.activeConstraints;
        }

        // Add a small delay for readability/rate-limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n✨ Simulation Complete.");
}

function getMockResponse(phase: number, currentState: ProjectState) {
    return {
        phase: phase,
        phaseName: `Phase ${phase} (Mock)`,
        activeConstraints: [...currentState.activeConstraints, `Constraint_Phase_${phase}`],
        taskPrompt: `Generated task for phase ${phase}...`,
        rules: ["Rule 1", "Rule 2"],
        expectedArtifactType: "code",
        updatedProjectState: {
            phase: phase + 1, // Auto-increment for simulation
            technicalDebt: currentState.technicalDebt + 10,
            activeConstraints: [...currentState.activeConstraints, `Constraint_Phase_${phase}`],
            decisionLog: [...currentState.decisionLog, `Decision_Phase_${phase}`],
            systemShape: "Evolving"
        }
    };
}

runSimulation();
