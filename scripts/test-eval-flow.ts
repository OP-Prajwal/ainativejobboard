
import { evaluateCandidateAction } from '../app/actions/evaluate-candidate';
import prisma from '../lib/prisma';

async function main() {
    console.log("Testing Evaluation Action...");

    // Find the latest application
    const app = await prisma.application.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!app) {
        console.error("No application found to test.");
        return;
    }

    console.log(`Evaluating App ID: ${app.id}`);

    // Call the action directly
    const result = await evaluateCandidateAction(app.id);

    console.log("Result Success:", result.success);
    if (result.report) {
        console.log(`Report Items: ${result.report.length}`);
        console.log(JSON.stringify(result.report, null, 2));
    } else {
        console.log("No report returned.");
        if (result.error) console.error("Error:", result.error);
    }
}

main();
