
import { execSync } from 'child_process';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

const leads = [
    { phone: '+554792298193', name: 'Lead' },
    { phone: '+555492820145', name: 'Lead' },
    { phone: '+558699177672', name: 'Lead' },
    { phone: '+5511956089769', name: 'Lead' },
    { phone: '+5511969815798', name: 'Sthefani Molino', special: 'Pós TRINTAE3 no boleto em 18x' },
    { phone: '+553388550491', name: 'Lead' },
    { phone: '+5511987698292', name: 'Lead' },
    { phone: '+553188987035', name: 'Lead' }
];

async function processLeads() {
    for (const lead of leads) {
        let message = `Olá! Peço mil desculpas, tivemos uma pequena instabilidade técnica no nosso sistema agora há pouco e você acabou recebendo uma mensagem de erro. Já corrigimos tudo e estou aqui para te ajudar!\n\n`;
        
        if (lead.special) {
            message += `Sobre o que conversávamos, podemos fechar a sua vaga na ${lead.special}?`;
        } else {
            message += `Como posso te ajudar agora?`;
        }

        try {
            console.log(`Sending to ${lead.phone}...`);
            // Usando o comando nativo do OpenClaw para enviar
            const cmd = `openclaw message send --channel whatsapp --target "${lead.phone}" --message "${message.replace(/"/g, '\\"')}"`;
            execSync(cmd);
            
            // Registrando no NeonDB
            await sql`
                INSERT INTO laura_memories (content, metadata)
                VALUES (${`Pedido de desculpas e reativação enviada para ${lead.phone} (${lead.name})`}, ${JSON.stringify({ type: 'sdr_action', action: 'apology_sent', lead: lead.phone })})
            `;
            console.log(`Success for ${lead.phone}`);
        } catch (err) {
            console.error(`Error for ${lead.phone}:`, err.message);
        }
    }
}

processLeads();
