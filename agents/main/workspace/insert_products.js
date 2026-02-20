import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

const products = [
  {
    name: 'TRINTAE3 (Mentoria + Pós-Graduação)',
    description: 'Única pós-graduação em Saúde Estética Avançada que também é mentoria. Foco em técnica, business e posicionamento high-ticket.',
    price: 16000.00,
    format: 'Pós-graduação + Mentoria',
    category: 'Educação Avançada',
    details: {
      duration: '6 meses (Mentoria) / 1 ano (Acesso)',
      hours: 534,
      practice_hours: 100,
      phases: [
        'Fase 1: Anatomia em Cadáveres Frescos (ITC-SP)',
        'Fase 2: Prática Supervisionada em Duplas',
        'Fase 3: Imersão Rennova + Prática Clínica em Goiânia'
      ],
      certification: 'MEC / Conselhos de Classe',
      mentors: ['Dra. Sacha', 'Dr. Eduardo Pontel', 'Dr. Diego Dias']
    }
  },
  {
    name: 'COMU US (Comunidade / Ecossistema)',
    description: 'Ecossistema de ensino contínuo e pertencimento para profissionais da saúde estética. Espaço para conexão, suporte e evolução constante.',
    price: 1600.00,
    format: 'Comunidade (Assinatura Anual)',
    category: 'Comunidade',
    details: {
      included: [
        'App Circle (Comunidade ativa)',
        'Trilha "Captar a Fidelizar"',
        '2 encontros ao vivo/mês (Capacitação e Conexão)'
      ],
      benefits: ['Networking internacional', 'Suporte técnico', 'Educação contínua']
    }
  },
  {
    name: 'NEON (Mentoria Black)',
    description: 'Mentoria Black de negócios para empresários da saúde estética que buscam escala, gestão profissional e diferenciação.',
    price: null, // Premium / Sob consulta
    format: 'Mentoria Black (6 meses)',
    category: 'Mentoria Premium',
    details: {
      target: 'Donos de clínicas com faturamento ativo',
      included: [
        'Interação diária no WhatsApp',
        'Sessões individuais de diagnóstico (Zoom)',
        'Acompanhamento financeiro com Maurício Magalhães',
        '6 encontros mensais com especialistas (Marketing, Vendas, Gestão)',
        'Apoio emocional com psicóloga',
        'Viagem exclusiva de encerramento'
      ]
    }
  },
  {
    name: 'OTB - MBA Business & Aesthetic Health | Dubai',
    description: 'MBA internacional com imersão em Dubai. Foco em networking de alto luxo, visão global de negócios e tendências mundiais.',
    price: null,
    format: 'MBA + Imersão Internacional',
    category: 'MBA / Internacional',
    details: {
      location: 'Dubai (Emirados Árabes)',
      duration: 'MBA 320h online + Imersão presencial',
      event: 'AMWC Dubai 2026',
      highlights: ['Networking Shark', 'Experiência no deserto (Sonara Camp)', 'Hotel Taj Dubai']
    }
  },
  {
    name: 'Curso de Auriculoterapia',
    description: 'Formação em técnica complementar para controle de ansiedade, dor e emagrecimento, focada em gerar renda rápida.',
    price: null,
    format: 'Curso Online Gravado',
    category: 'Curso Técnico',
    details: {
      goal: 'Aumento de faturamento imediato com baixo custo',
      target: 'Profissionais que buscam ferramentas práticas'
    }
  }
];

async function insertProducts() {
  try {
    for (const p of products) {
      await sql`
        INSERT INTO products (name, description, price, format, category, details)
        VALUES (${p.name}, ${p.description}, ${p.price}, ${p.format}, ${p.category}, ${JSON.stringify(p.details)})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          format = EXCLUDED.format,
          category = EXCLUDED.category,
          details = EXCLUDED.details,
          updated_at = NOW();
      `;
      console.log(`Inserted/Updated: ${p.name}`);
    }
    console.log("All products processed.");
  } catch (err) {
    console.error("Insertion error:", err);
  }
}

insertProducts();
