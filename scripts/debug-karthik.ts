import prisma from '../lib/prisma';
import { fetchGithubProfile } from '../lib/enrichment';

async function debugKarthik() {
    console.log("=== Finding Karthik's Application ===\n");

    // Find all applications
    const apps = await prisma.application.findMany({
        select: {
            id: true,
            name: true,
            githubId: true,
            enrichmentData: true
        }
    });

    console.log("All applications:");
    apps.forEach(a => {
        const gh = (a.enrichmentData as any)?.github;
        console.log(`- ${a.name} | GitHub: ${a.githubId || 'none'} | Commits: ${gh?.stats?.recentActivity?.length || 0}`);
    });

    // Find Karthik specifically
    const karthik = apps.find(a => a.name.toLowerCase().includes('karthik'));

    if (karthik) {
        console.log("\n=== Found Karthik ===");
        console.log("GitHub ID:", karthik.githubId);

        if (karthik.githubId) {
            console.log("\n=== Fetching FRESH data from GitHub ===");
            const freshData = await fetchGithubProfile(karthik.githubId);

            console.log("Status:", freshData.error ? 'ERROR' : 'OK');
            if (freshData.error) {
                console.log("Error:", freshData.error);
            } else {
                console.log("Fresh commits:", freshData.stats?.recentActivity?.length || 0);
                console.log("Fresh languages:", freshData.stats?.topLanguages);
                console.log("Public repos:", freshData.stats?.publicRepos);
            }
        }
    } else {
        console.log("\nNo application found with name containing 'karthik'");
    }

    await prisma.$disconnect();
}

debugKarthik();
