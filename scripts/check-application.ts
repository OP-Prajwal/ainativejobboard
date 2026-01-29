import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
    console.log(`Checking for latest application...`);

    const application = await prisma.application.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { job: true }
    });

    if (!application) {
        console.log("No applications found in the database.");
        return;
    }

    console.log(`\nLatest Application Found:`);
    console.log(`ID: ${application.id}`);
    console.log(`Candidate: ${application.name} (${application.email})`);
    console.log(`Job: ${application.job.title} (ID: ${application.jobId})`);
    console.log(`Submitted At: ${application.createdAt.toISOString()}`);
    console.log(`Status: ${application.status}`);

    console.log(`Admin URL: http://localhost:3000/admin/jobs/${application.jobId}/applications`);

    console.log(`\nEnrichment Data:`);
    if (application.enrichmentData) {
        const data = application.enrichmentData as any;
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log("No enrichment data found.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
