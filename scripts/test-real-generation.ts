import 'dotenv/config';

import prisma from '../lib/prisma';
import { TaskAllocationService } from '../lib/task-allocation/service';
import * as fs from 'fs';

function log(msg: string) {
    fs.appendFileSync('test_log.txt', msg + '\n');
    console.log(msg);
}

async function testRealGeneration() {
    log("🌱 Seeding Test Data...");

    // 1. Create Company
    const company = await prisma.company.create({
        data: {
            name: "Acme Corp",
            slug: `acme-corp-${Date.now()}`,
            status: "active"
        }
    });

    // 2. Create Job with rawRequirements
    const job = await prisma.job.create({
        data: {
            companyId: company.id,
            title: "Senior Systems Engineer",
            slug: `senior-systems-${Date.now()}`,
            description: "Legacy description (should be ignored)",
            rawRequirements: {
                message: "This is the REAL source of truth.",
                technologies: ["Rust", "WASM"],
                challenge: "Build a plugin system that runs untrusted code safely."
            },
            status: "active"
        }
    });

    // 3. Create Application
    const application = await prisma.application.create({
        data: {
            jobId: job.id,
            name: "Test Candidate",
            email: `test-${Date.now()}@example.com`,
            resumeUrl: "http://example.com/resume.pdf",
            enrichmentData: {
                // Empty state initially
            }
        }
    });

    log(`✅ Seeded: Job ${job.id}, App ${application.id}`);

    // 4. Run Service Loop
    const service = new TaskAllocationService();

    for (let phase = 1; phase <= 7; phase++) {
        log(`\n-----------------------------------`);
        log(`🚀 Generating Phase ${phase} Task...`);
        log(`-----------------------------------`);

        const result = await service.generateNextTask(application.id);

        log(`[Phase ${phase}] Task Type: ${result.task.taskType}`);
        log(`[Phase ${phase}] Prompt: ${result.task.description.substring(0, 80)}...`);

        const generatedState = result.projectState;
        log(`[Phase ${phase}] Active Constraints: ${generatedState.activeConstraints.join(', ')}`);

        // Simulate "Completing" the task to move to next phase
        if (phase < 7) {
            log(`➡️  Simulating completion... Advancing to Phase ${phase + 1}`);

            // Fetch current state to ensure we carry forward constraints
            // (Service already saved result.projectState, so we just bump the phase)
            const currentState = result.projectState; // This has the *new* constraints from this phase

            await prisma.application.update({
                where: { id: application.id },
                data: {
                    enrichmentData: {
                        projectState: {
                            ...currentState,
                            phase: phase + 1
                        }
                    }
                }
            });
        }
    }
}

testRealGeneration()
    .catch((e) => log("ERROR: " + e))
    .finally(async () => {
        // cleanup if needed, but keeping data for inspection is fine in dev
        // await db.$disconnect();
    });
