import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        const client = await pool.connect();
        console.log('Fetching job details...');
        const res = await client.query(`
        SELECT title, experience_level, slug 
        FROM jobs 
        WHERE title ILIKE '%senior%'
    `);
        console.log('Jobs with Senior in title:', res.rows);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
