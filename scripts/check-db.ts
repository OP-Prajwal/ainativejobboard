import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database connection string...');
    // Do not log full credentials in production, but here in dev we need to verify consistency
    // console.log(process.env.DATABASE_URL); 

    console.log('Querying information_schema for table "jobs"...');
    try {
        const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs';
    `;
        console.log('Columns in "jobs" table:', columns);
    } catch (e) {
        console.error('Error querying raw SQL:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
