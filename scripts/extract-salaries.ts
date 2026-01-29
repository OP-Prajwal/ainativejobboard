import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        const client = await pool.connect();
        console.log('Fetching jobs with string salary...');
        const res = await client.query(`SELECT id, salary FROM jobs WHERE salary IS NOT NULL`);

        for (const job of res.rows) {
            const s = job.salary.toLowerCase();
            const numbers = s.match(/\d+/g)?.map(Number);

            if (numbers && numbers.length > 0) {
                let min = numbers[0];
                let max = numbers.length > 1 ? numbers[1] : min;

                // Handle "k" suffix logic simple check
                if (s.includes('k') && min < 1000) min *= 1000;
                if (s.includes('k') && max < 1000) max *= 1000;

                console.log(`Updating Job ${job.id}: ${job.salary} -> Min: ${min}, Max: ${max}`);

                await client.query(`
                UPDATE jobs 
                SET salary_min = $1, salary_max = $2 
                WHERE id = $3
            `, [min, max, job.id]);
            }
        }
        console.log('Done updating salaries.');
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
