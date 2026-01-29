import { ingestGitHubHistory } from '../lib/evaluation/intake';
import { isNoise } from '../lib/evaluation/purifier';

async function testPurifier() {
    console.log("--- Testing Purifier Logic ---");
    const files = [
        'package.json',
        'src/app.tsx',
        'lib/utils.ts',
        'yarn.lock',
        '.github/workflows/main.yml',
        'dist/bundle.js'
    ];

    files.forEach(f => {
        console.log(`${f}: ${isNoise(f) ? 'REMOVED' : 'KEPT'}`);
    });
}

async function testIntake() {
    console.log("\n--- Testing Intake Pipeline (Real GitHub) ---");

    // List of active devs to try until we hit one with recent PushEvents
    const candidates = ['leerob', 'shadcn', 'yyx990803', 'Rich-Harris', 'egoist', 'antfu'];

    for (const user of candidates) {
        console.log(`\nChecking candidate: ${user}...`);
        try {
            const context = await ingestGitHubHistory(user, 5);
            if (context.length > 0) {
                console.log(`✅ SUCCESS: Found ${context.length} purified commits for ${user}`);
                console.log(JSON.stringify(context, null, 2));
                return; // Found our proof
            } else {
                console.log(`⚠️ No signals found for ${user} (History empty or filtered out)`);
            }
        } catch (e) {
            console.error(`❌ Error fetching ${user}:`, e);
        }
    }

    console.log("❌ Could not find recent PushEvents for any candidate in list.");
}

async function main() {
    await testPurifier();
    await testIntake();
}

main();
