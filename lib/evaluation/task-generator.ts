import { BeliefEngine } from './belief-engine';

export type TaskDefinition = {
    id: string;
    title: string;
    targetSignal: string;
    difficulty: 'easy' | 'medium' | 'hard';
    description: string;
    constraints: string[]; // e.g. "No external libraries", "O(n) time"
};

// Mock Task Library (In a real system, this would be a DB or CMS)
const TASK_LIBRARY: TaskDefinition[] = [
    {
        id: 'task-auth-middleware',
        title: 'Implement JWT Middleware',
        targetSignal: 'signal:security',
        difficulty: 'medium',
        description: 'Create a Koa/Express middleware that validates a JWT token.',
        constraints: ['Handle expiration', 'No partial verifies']
    },
    {
        id: 'task-refactor-controller',
        title: 'Refactor Monolithic Controller',
        targetSignal: 'signal:refactoring-tendency',
        difficulty: 'hard',
        description: 'Break down this 500-line controller into focused services.',
        constraints: ['Maintain API compatibility', 'Dependency Injection']
    },
    {
        id: 'task-optimize-query',
        title: 'Optimize N+1 Query',
        targetSignal: 'signal:database-optimization',
        difficulty: 'medium',
        description: 'Fix the N+1 problem in this Prisma query.',
        constraints: ['Single DB roundtrip', 'Use include/select']
    },
    {
        id: 'task-unit-test-suite',
        title: 'Write Jest Test Suite',
        targetSignal: 'signal:testing-discipline',
        difficulty: 'easy',
        description: 'Write comprehensive tests for this currency utils module.',
        constraints: ['100% Branch Coverage', 'Test boundary conditions']
    }
];

export class TaskGenerator {

    // Core Logic: "Information Gain Maximization"
    // We want the task that targets the HIGHEST UNCERTAINTY signal.
    selectNextTask(beliefReport: any[]): TaskDefinition | null {
        // 1. Sort beliefs by Uncertainty (Desc)
        const sorted = [...beliefReport].sort((a, b) => b.Uncertainty - a.Uncertainty);

        console.log("[TaskGen] Priorities based on Uncertainty:", sorted.map(s => `${s.Signal}: ${s.Uncertainty}`));

        for (const belief of sorted) {
            // 2. Find a task that targets this signal
            // In a real system, we'd also check difficulty matching (Candidate Skill vs Task Difficulty)
            const signalKey = `signal:${belief.Signal.toLowerCase()}`;

            const task = TASK_LIBRARY.find(t => t.targetSignal === signalKey || t.targetSignal.includes(belief.Signal.toLowerCase()));

            if (task) {
                console.log(`[TaskGen] Selected Task '${task.title}' to resolve uncertainty in '${belief.Signal}'`);
                return task;
            }
        }

        console.log("[TaskGen] No suitable task found for top uncertainties.");
        return null; // No task available for strictly uncertain signals
    }

    // MVP Helper: Get a random task if we want to probe a new area
    suggestExploratoryTask(): TaskDefinition {
        return TASK_LIBRARY[Math.floor(Math.random() * TASK_LIBRARY.length)];
    }
}
