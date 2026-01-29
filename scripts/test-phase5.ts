import { TaskGenerator } from '../lib/evaluation/task-generator';

function main() {
    console.log("--- Testing Phase 5: Task Generation ---");

    // 1. Simulate a Belief Report (High Uncertainty in 'Refactoring', Low in 'Testing')
    const beliefReport = [
        {
            Signal: 'testing-discipline',
            'Capability Score': '0.80',
            'Uncertainty': '0.30', // Low uncertainty (we have lots of evidence)
            'Evidence Count': '5.0'
        },
        {
            Signal: 'refactoring-tendency',
            'Capability Score': '0.50',
            'Uncertainty': '0.90', // High uncertainty (we have almost no evidence)
            'Evidence Count': '0.1'
        },
        {
            Signal: 'security',
            'Capability Score': '0.50',
            'Uncertainty': '0.95', // Highest uncertainty
            'Evidence Count': '0.0'
        }
    ];

    console.log("Current Belief State:");
    console.table(beliefReport);

    // 2. Run Generator
    const generator = new TaskGenerator();
    const nextTask = generator.selectNextTask(beliefReport);

    if (nextTask) {
        console.log("\n✅ Generated optimal task:");
        console.log(`Title: ${nextTask.title}`);
        console.log(`Target: ${nextTask.targetSignal}`);
        console.log(`Why? To reduce uncertainty of 0.95 in Security.`);
    } else {
        console.log("❌ Failed to generate task.");
    }
}

main();
