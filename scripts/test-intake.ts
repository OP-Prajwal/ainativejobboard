import 'dotenv/config';
import { ingestGitHubHistory } from '../lib/evaluation/intake';

async function main() {
    const username = 'mohit782005';
    console.log(`Testing Intake for: ${username}`);

    const commits = await ingestGitHubHistory(username, 10);

    console.log(`Found ${commits.length} commits.`);

    if (commits.length === 0) {
        console.error("FAIL: No commits found (Would trigger Mock Data fallback)");
    } else {
        console.log("SUCCESS: Real commits found!");
        commits.slice(0, 3).forEach(c => {
            console.log(` - [${c.date}] ${c.message}`);
        });
    }
}

main();
