
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Verification Data...');

    // 1. Create or Find Company
    const company = await prisma.company.upsert({
        where: { slug: 'finalround-ai' },
        update: {},
        create: {
            name: 'FinalRound AI',
            slug: 'finalround-ai',
            logo: '/companies/finalround.png',
            website: 'https://finalroundai.com',
            description: 'The AI-native job board.',
        },
    });

    // 2. Create Job
    const job = await prisma.job.create({
        data: {
            title: 'Senior AI Engineer',
            slug: `senior-ai-engineer-${Date.now()}`,
            location: 'Remote',
            salary: '$150k - $200k',
            type: 'Full-time',
            description: 'We are looking for an AI engineer to build our evaluation engine.',
            companyId: company.id,
            status: 'active',
            category: 'software-engineering',
        },
    });

    console.log(`✅ Created Job: ${job.title}`);

    // 3. Create Application
    const app = await prisma.application.create({
        data: {
            jobId: job.id,
            name: 'Jane Doe',
            email: 'jane@example.com',
            // Using a real repo for the purifier to find
            resumeUrl: 'https://github.com/torvalds/linux', // Using Linux as a valid URL, though scraper looks at githubId mainly
            githubId: 'torvalds', // Linus Torvalds as a test subject (lots of data!)
            status: 'pending',
        },
    });

    console.log(`✅ Created Application for ${app.name}`);
    console.log(`👉 Go to: http://localhost:3000/admin/jobs/${job.id}/applications`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
