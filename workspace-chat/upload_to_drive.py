import os
import subprocess
import json

BASE_DIR = "/Users/mauricio/.openclaw/alunos"
PARENT_ID = "1omqlI_hVtiV34J-KaFJdlLY1NdfW4Fna"
ACCOUNT = "suporte@drasacha.com.br"

def upload_files():
    count = 0
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if f.startswith("Ficha_Completa_") and f.endswith(".docx"):
                path = os.path.join(root, f)
                print(f"Uploading: {f}...")
                cmd = [
                    "gog", "drive", "upload", path,
                    "--parent", PARENT_ID,
                    "--account", ACCOUNT,
                    "--json", "--no-input"
                ]
                try:
                    subprocess.run(cmd, check=True, capture_output=True)
                    count += 1
                except subprocess.CalledProcessError as e:
                    print(f"Error uploading {f}: {e.stderr.decode()}")
                
                if count >= 50: # Limit for now to test
                    print("Batch of 50 uploaded.")
                    # break # Uncomment to only do 50
    print(f"Total uploaded: {count}")

if __name__ == "__main__":
    upload_files()
