import os
import shutil

BASE_DIR = "/Users/mauricio/.openclaw/alunos"
EXPECTED_STRUCTURE = {
    "33": ["Turma 3", "Turma 4", "Turma 5", "Turma 6"],
    "NEON": ["Ciclo 1", "Ciclo 2", "Ciclo 3"],
    "OTB": ["Ciclo Unico"]
}

def clean_garbage():
    for curso, turmas in EXPECTED_STRUCTURE.items():
        curso_path = os.path.join(BASE_DIR, curso)
        if not os.path.exists(curso_path):
            continue
            
        for item in os.listdir(curso_path):
            item_path = os.path.join(curso_path, item)
            
            # Se não for uma das turmas esperadas e for um diretório, apaga
            if os.path.isdir(item_path) and item not in turmas:
                print(f"🗑️ Removendo estrutura incorreta: {curso}/{item}")
                shutil.rmtree(item_path)

if __name__ == "__main__":
    clean_garbage()
