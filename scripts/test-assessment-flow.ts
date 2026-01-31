/**
 * AI-Native Assessment Flow Test
 * 
 * This script tests the complete assessment lifecycle:
 * 1. Create dummy job, application, and task
 * 2. Assign task to application
 * 3. Start assessment
 * 4. Submit mock data
 * 5. Run grading
 * 6. Assert stored score + status
 * 
 * Run with: npx tsx scripts/test-assessment-flow.ts
 */

import 'dotenv/config';
import prisma from '../lib/prisma';

// Color helpers for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(msg: string, color = '') {
    console.log(`${color}${msg}${colors.reset}`);
}

function success(msg: string) { log(`✅ ${msg}`, colors.green); }
function error(msg: string) { log(`❌ ${msg}`, colors.red); }
function info(msg: string) { log(`ℹ️  ${msg}`, colors.cyan); }
function step(msg: string) { log(`\n${colors.bold}➤ ${msg}${colors.reset}`); }

async function cleanup(jobId: string) {
    // Clean up test data (cascades will handle related records)
    try {
        await prisma.job.delete({ where: { id: jobId } });
        info('Cleaned up test data');
    } catch {
        // Ignore if already deleted
    }
}

async function main() {
    log('\n🧪 AI-Native Assessment Flow Test\n', colors.bold);

    let testJobId: string | null = null;

    try {
        // Step 1: Create test company (or use existing)
        step('1. Creating test data...');

        // Check for existing test company or create one
        let company = await prisma.company.findFirst({
            where: { slug: 'test-company-assessment' }
        });

        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: 'Test Company',
                    slug: 'test-company-assessment',
                    status: 'verified'
                }
            });
            info('Created test company');
        } else {
            info('Using existing test company');
        }

        // Create test job with a task
        const job = await prisma.job.create({
            data: {
                title: 'Test Software Engineer',
                slug: `test-job-${Date.now()}`,
                description: 'Test position for assessment flow testing',
                companyId: company.id,
                status: 'active',
                rawRequirements: { skills: ['TypeScript', 'Node.js'] }
            }
        });
        testJobId = job.id;
        success(`Created test job: ${job.id}`);

        // Create test task with invariants
        const task = await prisma.jobTask.create({
            data: {
                jobId: job.id,
                taskType: 'Coding Challenge',
                description: `## Task: Fix the Bug

You are given a function that should calculate the factorial of a number.
However, there is a bug in the implementation.

\`\`\`javascript
function factorial(n) {
    if (n === 0) return 0; // BUG: should return 1
    return n * factorial(n - 1);
}
\`\`\`

Your task:
1. Fix the bug
2. Handle edge cases (negative numbers, non-integers)
3. Optimize if possible

You may use AI tools to help. Document your process.`,
                starterCode: `function factorial(n) {
    if (n === 0) return 0;
    return n * factorial(n - 1);
}`,
                taskInvariants: [
                    'factorial(0) should return 1',
                    'factorial(5) should return 120',
                    'Negative numbers should throw or return error',
                    'Non-integer inputs should be handled'
                ],
                difficultyLevel: 2,
                estimatedTimeHours: 0.5
            }
        });
        success(`Created test task: ${task.id}`);

        // Create test application
        const application = await prisma.application.create({
            data: {
                jobId: job.id,
                name: 'Test Candidate',
                email: 'test@example.com',
                resumeUrl: 'https://example.com/resume.pdf',
                status: 'pending'
            }
        });
        success(`Created test application: ${application.id}`);

        // Step 2: Assign task
        step('2. Assigning task to application...');

        const { assignTasks } = await import('../app/actions/assessment');
        const assignResult = await assignTasks(application.id);

        if (!assignResult.success) {
            throw new Error(`Assignment failed: ${assignResult.error}`);
        }

        const assignmentId = assignResult.data[0].assignmentId;
        success(`Task assigned: ${assignmentId}`);

        // Check assignment is in PENDING status
        let assignment = await prisma.taskAssignment.findUnique({
            where: { id: assignmentId }
        });

        if (assignment?.status !== 'PENDING') {
            throw new Error(`Expected PENDING status, got ${assignment?.status}`);
        }
        success('Assignment status: PENDING ✓');

        // Step 3: Start assessment
        step('3. Starting assessment...');

        const { startAssessment } = await import('../app/actions/assessment');
        const startResult = await startAssessment(assignmentId);

        if (!startResult.success) {
            throw new Error(`Start failed: ${startResult.error}`);
        }

        success(`Assessment started at: ${startResult.data.startedAt}`);

        // Test idempotency - calling again should return same startedAt
        const startResult2 = await startAssessment(assignmentId);
        if (!startResult2.success) {
            throw new Error('Idempotent call failed');
        }

        if (startResult.data.startedAt.getTime() !== startResult2.data.startedAt.getTime()) {
            throw new Error('startAssessment is NOT idempotent - startedAt changed!');
        }
        success('startAssessment idempotency verified ✓');

        // Check status is IN_PROGRESS
        assignment = await prisma.taskAssignment.findUnique({
            where: { id: assignmentId }
        });

        if (assignment?.status !== 'IN_PROGRESS') {
            throw new Error(`Expected IN_PROGRESS status, got ${assignment?.status}`);
        }
        success('Assignment status: IN_PROGRESS ✓');

        // Step 4: Submit assessment
        step('4. Submitting assessment...');

        const submissionData = {
            initialPrompt: `Fix this function:
\`\`\`javascript
function factorial(n) {
    if (n === 0) return 0;
    return n * factorial(n - 1);
}
\`\`\`

Requirements:
- Fix the bug (0! should be 1)
- Handle negative numbers
- Handle non-integers`,

            aiDraft: `function factorial(n) {
    if (n < 0) {
        throw new Error("Factorial is not defined for negative numbers");
    }
    if (!Number.isInteger(n)) {
        throw new Error("Factorial is only defined for integers");
    }
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
}`,

            finalSubmission: `function factorial(n) {
    // Validate input
    if (typeof n !== 'number' || isNaN(n)) {
        throw new TypeError("Input must be a number");
    }
    if (n < 0) {
        throw new RangeError("Factorial is not defined for negative numbers");
    }
    if (!Number.isInteger(n)) {
        throw new TypeError("Factorial is only defined for non-negative integers");
    }
    
    // Base cases
    if (n === 0 || n === 1) return 1;
    
    // Iterative approach to avoid stack overflow for large n
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}`,

            refinementExplanation: `I made the following changes to the AI-generated code:
1. Added explicit type checking for non-number inputs
2. Changed recursive to iterative implementation to avoid stack overflow
3. Used more specific error types (TypeError, RangeError)
4. Added more descriptive error messages`,

            unchangedExplanation: `I kept the basic structure of input validation because the AI's approach was sound.
However, I changed the implementation from recursive to iterative which the AI could have suggested but I preferred for performance reasons.`
        };

        const { submitAssessment } = await import('../app/actions/assessment');
        const submitResult = await submitAssessment(assignmentId, submissionData);

        if (!submitResult.success) {
            throw new Error(`Submit failed: ${submitResult.error}`);
        }

        success(`Submitted at: ${submitResult.data.submittedAt}`);
        success(`Time taken: ${submitResult.data.timeTakenSeconds} seconds`);

        // Check status is SUBMITTED
        assignment = await prisma.taskAssignment.findUnique({
            where: { id: assignmentId }
        });

        if (assignment?.status !== 'SUBMITTED') {
            throw new Error(`Expected SUBMITTED status, got ${assignment?.status}`);
        }
        success('Assignment status: SUBMITTED ✓');

        // Step 5: Grade assessment
        step('5. Running AI grading...');

        const { gradeAssessment } = await import('../app/actions/assessment');
        const gradeResult = await gradeAssessment(assignmentId);

        if (!gradeResult.success) {
            throw new Error(`Grading failed: ${gradeResult.error}`);
        }

        success(`Score: ${gradeResult.data.score}/100`);
        success(`Confidence: ${(gradeResult.data.confidence * 100).toFixed(0)}%`);
        info(`Feedback: ${gradeResult.data.feedback.substring(0, 100)}...`);

        // Step 6: Verify stored data
        step('6. Verifying stored data...');

        assignment = await prisma.taskAssignment.findUnique({
            where: { id: assignmentId }
        });

        if (assignment?.status !== 'GRADED') {
            throw new Error(`Expected GRADED status, got ${assignment?.status}`);
        }
        success('Assignment status: GRADED ✓');

        if (assignment?.aiScore === null || assignment?.aiScore === undefined) {
            throw new Error('aiScore not stored');
        }
        success(`Stored aiScore: ${assignment.aiScore} ✓`);

        if (assignment?.confidence === null || assignment?.confidence === undefined) {
            throw new Error('confidence not stored');
        }
        success(`Stored confidence: ${assignment.confidence.toFixed(2)} ✓`);

        if (!assignment?.aiFeedback) {
            throw new Error('aiFeedback not stored');
        }
        success('aiFeedback stored ✓');

        if (!assignment?.diffSummary) {
            throw new Error('diffSummary not stored');
        }
        success('diffSummary stored ✓');

        // Final summary
        log('\n' + '═'.repeat(50), colors.green);
        log('🎉 ALL TESTS PASSED!', colors.bold + colors.green);
        log('═'.repeat(50) + '\n', colors.green);

        info(`Test Job ID: ${job.id}`);
        info(`Test Application ID: ${application.id}`);
        info(`Test Assignment ID: ${assignmentId}`);
        info(`Final Score: ${assignment.aiScore}/100 (${assignment.requiresHumanReview ? 'NEEDS REVIEW' : 'OK'})`);

    } catch (err) {
        error(`Test failed: ${err}`);
        console.error(err);
        process.exit(1);
    } finally {
        // Clean up
        if (testJobId) {
            await cleanup(testJobId);
        }
        await prisma.$disconnect();
    }
}

main();
