import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        console.log('Checking updated_at...');
        const client = await pool.connect();

        // Check for updated_at
        const check = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'updated_at';
    `);

        if (check.rows.length === 0) {
            console.log('Column "updated_at" missing. Adding it now...');
            await client.query(`
            ALTER TABLE jobs 
            ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        `);
            console.log('Column "updated_at" added successfully.');
        } else {
            console.log('Column "updated_at" already exists.');
        }

        client.release();
    } catch (err) {
        console.error('Error applying fix:', err);
    } finally {
        await pool.end();
    }
}

main();
