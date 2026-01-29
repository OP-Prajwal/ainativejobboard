import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        const client = await pool.connect();
        console.log('Fetching distinct categories...');
        const res = await client.query(`SELECT DISTINCT category FROM jobs`);
        console.log('Categories in DB:', res.rows);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
