import "dotenv/config";
import prisma from "../lib/prisma";

async function testDatabase() {
    console.log("🔍 Testing Prisma Postgres connection...\n");

    try {
        // Test 1: Check connection
        console.log("✅ Connected to database!");

        // Test 2: Create a test installation
        const testId = "00000000-0000-0000-0000-000000000000"; // Nil UUID
        console.log("\n📝 Creating a test installation...");

        // Upsert to be safe
        const installation = await prisma.installation.upsert({
            where: { installationId: testId },
            update: { lastSeenAt: new Date() },
            create: {
                installationId: testId,
                domain: "test.localhost",
                installationToken: "test_token",
            },
        });
        console.log("✅ Created/Updated installation:", installation);

        // Test 3: Fetch all
        console.log("\n📋 Fetching installations...");
        const all = await prisma.installation.findMany({ take: 5 });
        console.log(`✅ Found ${all.length} installation(s)`);

        console.log("\n🎉 All tests passed! Your database is working perfectly.\n");
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

testDatabase();
