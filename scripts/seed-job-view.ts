
import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
    console.log("🌱 Seeding Job for Full Flow Test...");

    // 1. Create Company
    const company = await prisma.company.create({
        data: {
            name: "FinalRoundAI",
            slug: `final-round-ai-${Date.now()}`,
            status: "active"
        }
    });

    // 2. Create Job
    const job = await prisma.job.create({
        data: {
            companyId: company.id,
            title: "Frontend Architect",
            slug: `frontend-arch-${Date.now()}`,
            description: "Design a complex UI system for the Future of Hiring. This is a plugin-based architecture role.",
            rawRequirements: {
                task: "Build a stateful simulation UI.",
                stack: ["Next.js", "Tailwind", "Prisma"]
            },
            status: "active",
            category: "Engineering",
            subcategory: "Frontend",
            type: "Full-time",
            location: "Remote"
        }
    });

    console.log("\n✅ Job Setup Complete");
    console.log(`Job URL: http://localhost:3000/jobs/view/${job.slug}`);

    const fs = await import('fs');
    fs.appendFileSync('seed_job_output.txt', `http://localhost:3000/jobs/view/${job.slug}\n`);
}

main().catch(console.error);
