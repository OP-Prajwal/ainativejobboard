import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        const client = await pool.connect();
        console.log('Fetching job slugs...');
        const res = await client.query(`SELECT title, slug FROM jobs LIMIT 5`);
        console.log('Job Slugs:', res.rows);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
