
import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
    console.log("🌱 Seeding for UI Test...");

    // 1. Create Company
    const company = await prisma.company.create({
        data: {
            name: "UI Test Corp",
            slug: `ui-test-corp-${Date.now()}`,
            status: "active"
        }
    });

    // 2. Create Job
    const job = await prisma.job.create({
        data: {
            companyId: company.id,
            title: "Frontend Architect",
            slug: `frontend-arch-${Date.now()}`,
            description: "Design a complex UI system.",
            rawRequirements: {
                task: "Build a stateful simulation UI.",
                stack: ["Next.js", "Tailwind", "Prisma"]
            },
            status: "active"
        }
    });

    // 3. Create Application (Empty state)
    const application = await prisma.application.create({
        data: {
            jobId: job.id,
            name: "UI Tester",
            email: `ui-test-${Date.now()}@example.com`,
            resumeUrl: "http://example.com/resume.pdf",
            enrichmentData: {
                projectState: null // Force auto-init
            }
        }
    });

    console.log(`URL: http://localhost:3000/simulation/${application.id}`);
    const fs = await import('fs');
    fs.appendFileSync('seed_output.txt', `http://localhost:3000/simulation/${application.id}\n`);
}

main().catch(console.error);
