import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        console.log('Connecting to DB to apply fix...');
        const client = await pool.connect();

        // Check again
        const check = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'status';
    `);

        if (check.rows.length === 0) {
            console.log('Column "status" missing. Adding it now...');
            await client.query(`
            ALTER TABLE jobs 
            ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active';
        `);
            console.log('Column "status" added successfully.');
        } else {
            console.log('Column "status" already exists.');
        }

        client.release();
    } catch (err) {
        console.error('Error applying fix:', err);
    } finally {
        await pool.end();
    }
}

main();
