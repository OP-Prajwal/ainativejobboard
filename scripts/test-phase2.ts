import { interpretSummaries } from '../lib/evaluation/interpretation';

async function main() {
    console.log("--- Testing Phase 2: Interpretation Layer ---");

    // Mock Purified Summaries (Output of Phase 1)
    const mockInput = [
        {
            sha: 'abc1234',
            message: 'refactor: split parsing logic into separate module',
            stats: { logicScore: 4 },
            significantFiles: ['src/parser.ts']
        },
        {
            sha: 'def5678',
            message: 'feat: add unit tests for auth middleware',
            stats: { logicScore: 2 },
            significantFiles: ['tests/auth.test.ts']
        },
        {
            sha: 'ghi9012',
            message: 'fix: handle null pointer in user session',
            stats: { logicScore: 3 },
            significantFiles: ['src/session.ts']
        }
    ];

    console.log("Input Summaries:", JSON.stringify(mockInput, null, 2));

    const insights = await interpretSummaries(mockInput);

    console.log("\n--- Generated Observations (LLM Output) ---");
    console.log(JSON.stringify(insights, null, 2));
}

main();
