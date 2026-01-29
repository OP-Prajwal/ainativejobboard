import 'dotenv/config';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    console.log("Starting bulk seed...");
    // 1. Ensure Company Exists
    const companySlug = 'stripe';
    let company = await prisma.company.findUnique({ where: { slug: companySlug } });

    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'Stripe',
                slug: companySlug,
                status: 'verified',
                logoUrl: 'https://logo.clearbit.com/stripe.com'
            }
        });
    }

    // 2. Create 15 Software Engineering Jobs in Austin to test Main+Loc Threshold (10+)
    const jobsToCreate = [];
    for (let i = 0; i < 15; i++) {
        const id = uuidv4();
        const shortId = Math.random().toString(36).substring(2, 8);
        jobsToCreate.push({
            title: `Senior Software Engineer ${i + 1}`,
            description: `This is a test job description for job ${i + 1}. We are looking for great backend engineers.`,
            companyId: company.id,
            slug: `senior-software-engineer-${i + 1}-stripe-${shortId}`,
            type: "Full-time",
            location: "Austin, TX",
            salary: "$150k - $200k",
            salaryMin: 150000,
            salaryMax: 200000,
            experienceLevel: "Senior",
            category: "Software Engineering",
            subcategory: "Backend Developer", // Matches one of our subs
            status: "active",
            rawRequirements: {
                skills: ["TypeScript", "Go", "Postgres"]
            }
        });
    }

    // 3. Create 8 Data Science Jobs (Remote) to test Sub+Loc Threshold (3+)
    for (let i = 0; i < 8; i++) {
        const shortId = Math.random().toString(36).substring(2, 8);
        jobsToCreate.push({
            title: `Data Scientist ${i + 1}`,
            description: `Analyze data remotely.`,
            companyId: company.id,
            slug: `data-scientist-${i + 1}-stripe-${shortId}`,
            type: "Full-time",
            location: "Remote",
            salary: "$120k - $160k",
            salaryMin: 120000,
            salaryMax: 160000,
            experienceLevel: "Mid-level",
            category: "Data Science & Analytics",
            subcategory: "Data Scientist",
            status: "active",
            rawRequirements: {
                skills: ["Python", "Pandas", "SQL"]
            }
        });
    }

    // Insert all
    for (const job of jobsToCreate) {
        await prisma.job.create({ data: job });
    }

    console.log(`Seeded ${jobsToCreate.length} jobs successfully.`);
}

main()
    .catch(e => {
        console.error("SEED ERROR:", e);
    })
    .finally(async () => await prisma.$disconnect());
