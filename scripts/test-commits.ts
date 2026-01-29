import 'dotenv/config';
import { fetchGithubProfile } from '../lib/enrichment';

async function test() {
    console.log("Testing GitHub commit fetching...\n");

    // Test with a few usernames
    const usernames = ['OP-Prajwal', 'karthikv2k'];

    for (const username of usernames) {
        console.log(`\n=== ${username} ===`);
        const data = await fetchGithubProfile(username);

        if (data.error) {
            console.log(`Error: ${data.error}`);
        } else {
            console.log(`Commits: ${data.stats?.recentActivity?.length || 0}`);
            console.log(`Languages: ${data.stats?.topLanguages?.join(', ') || 'none'}`);
            console.log(`Public Repos: ${data.stats?.publicRepos || 0}`);
        }
    }
}

test();
