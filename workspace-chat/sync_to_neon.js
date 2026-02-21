const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const sql = neon(process.env.NEON_DATABASE_URL);

async function main() {
    const data = JSON.parse(fs.readFileSync('/tmp/students_sync.json', 'utf8'));
    console.log(`Starting sync of ${data.length} students...`);

    for (const s of data) {
        try {
            await sql`
                INSERT INTO students (name, email, phone, cpf, course, turma, total_paid, total_pending, raw_data)
                VALUES (${s.name}, ${s.email || null}, ${s.phone || null}, ${s.cpf || null}, ${s.course}, ${s.turma}, ${s.total_paid}, ${s.total_pending}, ${JSON.stringify(s.raw_data)})
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    cpf = EXCLUDED.cpf,
                    course = EXCLUDED.course,
                    turma = EXCLUDED.turma,
                    total_paid = EXCLUDED.total_paid,
                    total_pending = EXCLUDED.total_pending,
                    raw_data = EXCLUDED.raw_data,
                    last_sync = NOW();
            `;
        } catch (e) {
            console.error(`Error syncing ${s.name}: ${e.message}`);
        }
    }
    console.log('Sync complete.');
}

main();
