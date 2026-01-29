import 'dotenv/config';
import prisma from '../lib/prisma';
import { enrichCandidate } from '../lib/enrichment';

async function main() {
    console.log("Fixing enrichment for latest application...");

    const app = await prisma.application.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { job: true }
    });

    if (!app) {
        console.log("No application found.");
        return;
    }

    console.log(`Updating app: ${app.id} (${app.name})`);

    // Force re-enrichment
    if (app.githubId) {
        console.log(`Fetching fresh data for GitHub: ${app.githubId}`);
        const newData = await enrichCandidate({
            github: app.githubId,
            leetcode: app.leetcodeId || undefined,
            codeforces: app.codeforcesId || undefined
        });

        await prisma.application.update({
            where: { id: app.id },
            data: { enrichmentData: newData }
        });

        console.log("Success! Enrichment data updated.");
        console.log("New Stats:", JSON.stringify((newData as any).github?.stats, null, 2));
    } else {
        console.log("No GitHub ID to enrich.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
