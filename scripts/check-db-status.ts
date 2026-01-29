
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
    const jobs = await prisma.job.findMany({ include: { applications: true } });
    console.log(`Found ${jobs.length} jobs.`);

    jobs.forEach(job => {
        console.log(`- Job: ${job.title} (ID: ${job.id}) - Applications: ${job.applications.length}`);
    });

    if (jobs.length === 0) {
        console.log("No jobs found. You need to create a job first.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
