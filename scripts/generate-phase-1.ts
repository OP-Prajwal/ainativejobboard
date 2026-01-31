import { generatePhaseTask, LLMTaskInput } from '../lib/task-allocation/llm-task-generator';
import { Phase } from '../lib/task-allocation/types';

async function run() {
    const input: LLMTaskInput = {
        jobDescription: "Build a high-throughput, low-latency ad-bidding engine. The system must process 1M requests per second with < 10ms latency. Data consistency is balanced with speed.",
        candidateContext: {
            role: "Senior Backend Engineer",
            seniority: "senior",
            priorExperience: "Distributed systems, low-latency networking"
        },
        projectState: {
            phase: Phase.IDEAL,
            technicalDebt: 0,
            activeConstraints: [],
            decisionLog: [],
            systemShape: "Undefined"
        }
    };

    try {
        const result = await generatePhaseTask(input);

        // Ensure strictly JSON output as requested
        // Sometimes LLMs might include <think> tags or other noise even with format: json
        // We'll try to parse and re-stringify to be sure.
        let cleaned = result;
        if (result.includes('</think>')) {
            cleaned = result.split('</think>').pop()!.trim();
        }

        try {
            const parsed = JSON.parse(cleaned);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.error("Failed to parse JSON output from LLM.");
            console.log(cleaned);
        }
    } catch (error) {
        console.error("Error generating phase task:", error);
    }
}

run();
