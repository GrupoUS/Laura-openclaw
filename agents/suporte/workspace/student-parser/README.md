# Student Parser — Grupo US 🎓

Parser inteligente para organização e sincronização de alunos da Pós TRINTAE3.

## O que ele faz

1. **Extração inteligente de nomes**: Quando um aluno foi cadastrado só com e-mail, o parser extrai o nome do username do e-mail
   - `brunaalvesdejesus@gmail.com` → `Bruna Alves De Jesus`
   - `hailarodrigues74@gmail.com` → `Haila Rodrigues`
   - `pimenta.ramon@gmail.com` → `Pimenta Ramon`

2. **Renomeia pastas e arquivos** de email/SEM_NOME para nome do aluno

3. **Atualiza NeonDB** (tabela `students`) com os nomes corrigidos

4. **Filtra contas institucionais** (somos@commu.cc, etc.)

5. **Roda em cron** a cada 6h para manter tudo sincronizado

## Como usar

```bash
# Ver o que seria feito (sem alterar nada)
node parser.mjs --dry-run

# Executar tudo
node parser.mjs --execute

# Só ver o relatório atual
node parser.mjs --report-only
```

## Instalar o Cron (sync automático a cada 6h)

```bash
chmod +x cron.sh
crontab -e
# Adicionar:
0 */6 * * * /Users/mauricio/.openclaw/agents/coder/workspace/student-parser/cron.sh
```

## Adicionar novas turmas

Editar `parser.mjs`, seção `TURMAS`:

```javascript
const TURMAS = [
  { course: '33', turma: 'Turma 4' },
  { course: '34', turma: 'Turma 5' }, // ← adicionar aqui
];
```

## Lógica de extração de nome

1. Pegar a parte antes do `@` no email
2. Separar por `.`, `_`, `-`
3. Remover partes numéricas puras
4. Remover sufixos numéricos de palavras
5. Separar palavras concatenadas usando dicionário de nomes BR
6. Title Case com conectores (de, da, do)
7. Retorna `null` para contas institucionais

## Logs

Logs salvos em `./logs/sync_YYYYMMDD_HHMMSS.log`
Logs mais antigos que 30 dias são removidos automaticamente.
