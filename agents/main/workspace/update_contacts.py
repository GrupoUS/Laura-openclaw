import sys

def insert_after(file_path, search_str, insert_str):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    out = []
    inserted = False
    for line in lines:
        out.append(line)
        if search_str in line and not inserted:
            out.append(insert_str + '\n')
            inserted = True
            
    with open(file_path, 'w') as f:
        f.writelines(out)

# Update USER.md
insert_after(
    '/Users/mauricio/.openclaw/agents/main/workspace/USER.md',
    '| **Erika** | Consultora Comercial | +55 62 9943-8005 | Leads qualificados |',
    '| **Bruno** | Gestor de Projetos | +55 21 99086-9640 | Assuntos de projetos e equipe |'
)

# Update SOUL.md
insert_after(
    '/Users/mauricio/.openclaw/agents/main/workspace/SOUL.md',
    '| `+556299438005` | **Erika**',
    '| `+5521990869640` | **Bruno** | Assuntos de projeto. NUNCA sistema. |'
)

print("Updates applied.")
