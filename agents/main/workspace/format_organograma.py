import json

data = {
  "range": "'Página1'!A2:J30",
  "values": [
    [
      "Maurício Magalhães", "", "", "", "", "TI", "Sócio e CTO", "62 99977-6996", "mauricio@gpus.com.br", "Rua 38, N. 648, apto. 1403 - Ed. Mio Marista, setor Marista. CEP 74.150-250. Goiânia - Goiás. Em frente ao COREN/GO."
    ],
    [
      "Sacha Gualberto ", "", "", "", "", "Expert", "Sócia e CVO", "62 99971-4524", "sachamartinsg@gmail.com", "Rua 38, N. 648, apto. 1403 - Ed. Mio Marista, setor Marista. CEP 74.150-250. Goiânia - Goiás. Em frente ao COREN/GO."
    ],
    [
      "Bruno Paixão da Silva ", "(21) 99086-9640", "paixabruno160@gmail.com", "CEO", "25/01/1993", "Gestão ", "Gestor de Operações", "21 99086-9640", "paixaobruno160@gmail.com", "Rua Barão de Téfe, 216 - Apto 302 - Jardim 25 de agosto - Duque de Caxias, RJ - 25075-010 -  Brasil."
    ],
    [
      "Andressa Lima", "", "", "", "", "Marketing ", "Estrategista "
    ],
    [
      "Gabriel Gontijo De Jesus", "", "", "", "", "Marketing ", "Editor de vídeo ", "", "", "R. 23-A, 37 - St. Aeroporto, Goiânia - GO, 74075-330 Apartamento 201 Residencial Antares"
    ],
    [
      "High Pulse (Pedro)", "", "", "", "", "Marketing ", "Gestor de Tráfego ", "", "", "Endereço: Av. Mauro Ramos, 1970 Sala 202 - Centro, Florianópolis - SC, 88020-304"
    ],
    [
      "Filipe Amorim Santos Sousa", "", "", "", "", "Marketing ", "Copy ", "", "", "Condomínio Villas do Atlântico  Av. Afonso Pena, 820, Casa 39 - Jardim Planalto, Goiânia – GO CEP: 74333-270"
    ],
    [
      "Tânia Cristina Souza Costa", "", "", "", "", "Marketing ", "Gestora da Comunidade", "", "", "Avenida Araucária  Quadra P lote 10 Jardim Bela Vista Goiania- GO Cep: 74863020"
    ],
    [
      "João Paulo Barrionovo", "", "", "", "", "Marketing ", "Designer ", "", "", "Rua Romilda Saraiva Gomes, 360, ap 11 Ribeirão Preto/ SP 14095-500 Bairro: Parque Anhanguera"
    ],
    [
      "Rodrigo de Almeida", "", "", "", "", "Marketing ", "Gestorde Automação e Webdesigner ", "", "", "Av. Dimas Machado, 164, Bloco 1, ap 408 Uberlândia/MG 38413-291 Bairro: Chácaras Tubalina e Quartel"
    ],
    [
      "Riller Queiroz ", "", "", "", "", "Jurídico", "Jurídico ", "", "", "Rua do Atum, Qd. 55, Lt. 11, casa 2,Jardim Atlântico, Goiânia-GO. CEP 74.343-080."
    ],
    [
      "Laiane Cordeiro Gonçalves de Brito", "", "", "", "", "Jurídico", "Jurídico - Time Riller ", "", "", "Avenida 2ª Avenida, Qd. 01B Lt 60, Sala 202, Ed. London Office, Cidade Empresarial, Aparecida de Goiânia, Goiás, CEP 74934-605"
    ],
    [
      "Betania Rocha Damacena", "", "", "", "", "Cobrança", "Cobrança", "", "", "Rua do Atum, Qd. 55, Lt. 11, casa 2,Jardim Atlântico, Goiânia-GO. CEP 74.343-080."
    ],
    [
      "Renata Rovani Hoffmann", "", "", "", "", "Suporte ", "Suporte Adm e Trintar3", "", "", "Praça Conde de Porto Alegre, 77 apto 55 Centro Histórico, Porto Alegre – RS CEP 90020-130"
    ],
    [
      "Roberta Mendes", "", "", "", "", "Suporte ", "Secretária - Sacha", "", "", "R. 38, 648 Ap 1403 - St. Marista, Goiânia - GO, 74150-250"
    ],
    [
      "Lucas Welington Sousa Cirineu", "", "", "", "", "Comercial ", "Coordenador Comercial ", "", "", "71070515, Brasília/DF  Guara II, Polo de Modas, Rua 15, Lote 46, Apt 304"
    ],
    [
      "Érica Guirra", "", "", "", "", "Comercial ", "Comercial "
    ],
    [
      "Karuana Carvalho", "", "", "", "", "Saúde", "Psicóloga", "", "", "Rua Ipiranga, 1620, Edifício Andorra, apt.402 - Fátima, Teresina - PI, CEP 64049-912"
    ],
    [
      "Lucros Reais ", "", "", "", "", "Financeiro ", "BPO e Controler ", "12 98265-0086", "financeiro@gpus.com.br"
    ],
    [
      "Raquel Quintanilha ", "", "", "", "", "Coordenação ", "Coordenadora Pedagógica "
    ],
    [
      "Otavio Yoshiharu Badella Nagamori", "", "", "", "", "Coordenação ", "Coordenador Trintae3 HOF", "", "", "Rua Pericles Ramos Nº 255 bairro Jundiai Anápolis – Goiás CEP: 75110-570"
    ]
  ]
}

def safe_get(row, idx, default=""):
    if len(row) > idx:
        return str(row[idx]).strip()
    return default

output = "# ORGANOGRAMA.md - Grupo US\n\n## Membros da Equipe\n\n"

for row in data["values"]:
    nome = safe_get(row, 0)
    setor = safe_get(row, 5)
    funcao = safe_get(row, 6)
    contato = safe_get(row, 7) or safe_get(row, 1)
    email = safe_get(row, 8) or safe_get(row, 2)
    endereco = safe_get(row, 9)
    
    output += f"### {nome}\n"
    output += f"- **Setor:** {setor}\n"
    output += f"- **Função:** {funcao}\n"
    output += f"- **Contato:** {contato}\n"
    output += f"- **E-mail:** {email}\n"
    output += f"- **Endereço:** {endereco}\n\n"

with open('/Users/mauricio/.openclaw/agents/main/workspace/ORGANOGRAMA.md', 'w') as f:
    f.write(output)

print("Organograma updated.")
