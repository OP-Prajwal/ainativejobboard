import { enrichCandidate } from '../lib/enrichment';

async function main() {
    console.log("Testing Enrichment Service...");

    // Replace with real usernames to test
    const testProfiles = {
        github: "torvalds", // Linus Torvalds
        leetcode: "tourist", // Might not exist on LC, let's try generic or fail
        codeforces: "tourist" // Legendary competitive programmer
    };

    console.log("Fetching data for:", testProfiles);

    const results = await enrichCandidate(testProfiles);

    console.log(JSON.stringify(results, null, 2));
}

main();
