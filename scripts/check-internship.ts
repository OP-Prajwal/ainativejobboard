import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        const client = await pool.connect();
        console.log('Checking for Internship jobs...');
        const res = await client.query(`
        SELECT title, type, experience_level 
        FROM jobs 
        WHERE type ILIKE 'Internship' 
    `);
        console.log('Internship Jobs:', res.rows);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
