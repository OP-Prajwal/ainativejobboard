import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        const client = await pool.connect();
        console.log('Fetching salary data...');
        const res = await client.query(`SELECT title, salary, salary_max FROM jobs LIMIT 10`);
        console.log('Job Salaries:', res.rows);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
