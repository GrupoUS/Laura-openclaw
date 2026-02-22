import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const numbers = [
  '+556399546167',
  '+5512991726474',
  '+5511972737261',
  '+553799994898',
  '+5511969815798',
  '+559899741836',
  '+5511919752205',
  '+553499785372',
  '+556484221157',
  '+553195257014',
  '+556299844848',
  '+555183027254',
  '+5521980938056'
];

async function main() {
  try {
    const results = await sql`
      SELECT phone, name, course, turma 
      FROM students 
      WHERE phone IN (${numbers.join(',')})
    `;
    console.log('Students found:', JSON.stringify(results, null, 2));

    const foundNumbers = results.map(r => r.phone);
    const potentialLeads = numbers.filter(n => !foundNumbers.includes(n));
    console.log('Potential Leads:', JSON.stringify(potentialLeads, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
