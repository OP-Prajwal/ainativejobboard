import prisma from '../lib/prisma';

async function main() {
    try {
        console.log("Connecting...");
        const count = await prisma.job.count();
        console.log(`Connection Successful. Job Count: ${count}`);
    } catch (e) {
        console.error("Connection Failed:", e);
    }
}

main();
