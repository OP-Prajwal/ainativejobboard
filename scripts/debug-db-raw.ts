import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
        console.log('Connected.');

        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs';
    `);

        console.log('COLUMNS IN JOBS TABLE:');
        res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();
