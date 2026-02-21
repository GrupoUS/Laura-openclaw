import os
import json
import re
from docx import Document
from pathlib import Path
from decimal import Decimal
import requests

# NeonDB Config
NEON_DATABASE_URL = "postgresql://neondb_owner:npg_P0ljy3pWNTYc@ep-falling-morning-acpph9w8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
BASE_DIR = "/Users/mauricio/.openclaw/alunos"

def parse_docx(path):
    doc = Document(path)
    content = {}
    current_section = None
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text: continue
        
        # Detect sections
        if "Informações de Cadastro" in text:
            current_section = "cadastro"
            continue
        elif "Histórico Financeiro" in text:
            current_section = "financeiro"
            continue
        elif "Acessos e Vendas" in text:
            current_section = "acessos"
            continue
            
        if ":" in text:
            parts = text.split(":", 1)
            if len(parts) == 2:
                key = parts[0].strip().lower()
                val = parts[1].strip()
                content[key] = val
                
    # Extract specific fields for table
    total_paid = 0.0
    total_pending = 0.0
    if "total pago" in content:
        try: total_paid = float(re.sub(r"[^0-9,.]", "", content["total pago"]).replace(",", "."))
        except: pass
    if "total pendente" in content:
        try: total_pending = float(re.sub(r"[^0-9,.]", "", content["total pendente"]).replace(",", "."))
        except: pass
        
    return {
        "name": content.get("name") or content.get("nome") or Path(path).parent.name,
        "email": content.get("email") or content.get("e-mail"),
        "phone": content.get("telefone") or content.get("whatsapp") or content.get("mobile"),
        "cpf": content.get("cpf") or content.get("documento"),
        "total_paid": total_paid,
        "total_pending": total_pending,
        "raw_data": content
    }

def sync_to_neon(data, course, turma):
    # Use Neon HTTP API via node or a small python script
    # For speed, I'll use a temporary JS script to batch insert
    pass

def main():
    students_data = []
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if f.startswith("Ficha_Completa_") and f.endswith(".docx"):
                path = os.path.join(root, f)
                # Structure: alunos/Course/Turma/Name
                parts = path.split(os.sep)
                course = parts[-4]
                turma = parts[-3]
                
                try:
                    student = parse_docx(path)
                    student["course"] = course
                    student["turma"] = turma
                    students_data.append(student)
                    print(f"Parsed: {student['name']}")
                except Exception as e:
                    print(f"Error parsing {path}: {e}")

    # Write data to a temp JSON for the JS loader
    with open("/tmp/students_sync.json", "w") as f:
        json.dump(students_data, f)

if __name__ == "__main__":
    main()
