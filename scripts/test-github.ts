import { fetchGithubProfile } from '../lib/enrichment';

async function main() {
    const username = 'mohit782005';
    console.log(`Fetching profile for: ${username}`);

    // Call the function directly to test logic
    const data = await fetchGithubProfile(username);

    console.log(JSON.stringify(data, null, 2));

    // Also debug raw events to see why matching might fail
    const events = await fetch(`https://api.github.com/users/${username}/events/public?per_page=10`).then(r => r.json());
    console.log("\n--- First 3 Raw Events ---");
    console.log(JSON.stringify(events.slice(0, 3), null, 2));

    const repos = await fetch(`https://api.github.com/users/${username}/repos?per_page=5&sort=pushed`).then(r => r.json());
    console.log("\n--- Top 5 Repos ---");
    console.log(repos.map((r: any) => `${r.full_name} (${r.stargazers_count} stars)`).join('\n'));
}

main();
