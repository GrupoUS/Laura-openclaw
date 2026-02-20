# Índice do Google Drive - Grupo US

**Pasta Raiz:** https://drive.google.com/drive/folders/1VlwI4ogZQx8QOoGr69ug5TF-bErTTNFc

## Estrutura Principal

### 0. Empresa | Grupo US
- **ID:** 1NkebQBSPSCcxVvKZM3n_TZmidSbmDfBR
- **Conteúdo:**
  - 0. Gestão Interna
  - 1. Material de Apresentação | Empresa
  - 2. Tutorial | Time Interno
  - 3. Reuniões | Grupo US
  - 4. Meet Recordings
  - 7. Time
  - 8. Zoom | Gravações
  - 9. AI Database
  - 10. Narrativas

### 1. Produtos | Grupo US (Alunos)
- **ID:** 1m0i53TKiGHtCC05zRKEc-snhyBZnmX75
- **Conteúdo:**
  - 1. Comunidade US
  - 2. Mentoria Trintae3 (Turmas 5, 6, HOF)
  - 3. Mentoria Black | Neon
  - 4. OTB (Out of The Box)
  - 5. NOUS CLUB

### 2. Projetos | Grupo US
- **ID:** 1677oxLtcN_ZIgAny0nA1mImtFs005gdT
- **Conteúdo:**
  - 1. Lançamentos
  - 2. Perpétuo
  - 3. Eventos | Grupo US
  - 4. Comunidade | US

### 3. Comercial | Grupo US
- **ID:** 1E4skSGKOcoOHUkildtRoss8byiqrAv_H
- **Conteúdo:**
  - 1. Copy | Comercial
  - 2. Simulador | Valores dos Produtos
  - 3. Material de Apoio
  - 4. Indicações
  - 5. ChatFunnel
  - 6. Planilhas dos alunos
  - 7. Rituais | Comercial

### 4. Coordenação & Suporte | Grupo US
- **ID:** 1FhnK5qMsAhV_VVXb8ua23dfMFtnT90r9
- **Conteúdo:**
  - 1. Painel de Controle | Aulas

### 5. Marketing | Grupo US
- **ID:** 1REzmJUDl2AAM-gB881f6gTb3HSOXn-GO
- **Conteúdo:**
  - 0. Identidade Visual | Geral
  - 1. Capas & Banners | Grupo Us
  - 3. Acessos Ferramentas | Marketing

### 6. Social Media | Grupo US
- **ID:** 1KtbzXSb_hl_HwDjmKZsteTp-EkM7dr0X
- **Conteúdo:**
  - 01. Posts IG
  - 2. Transcrições
  - 3. Roteiros Vídeos

### 7. Administração | Grupo US
- **ID:** 1gkh3gZz7cRtnWD0HatCTmRFwGWbOnbcM
- **Conteúdo:** (vazio ou arquivos diversos)

### 8. Pessoas | Grupo US
- **ID:** 1GkHKsg-UKggI4nxctSJlKaT-CoCz6roD
- **Conteúdo:**
  - 1. Equipe
  - 2. RH

### 9. Jurídico | Grupo US
- **ID:** 1tb1SMksWcKLTca20wTm7XSJijKOa1rad
- **Conteúdo:**
  - Docs

### 10. Fotos e vídeos
- **ID:** 1YphGYsKgeqKcCINlzH1hRkMHhXNK1mTy
- **Conteúdo:**
  - M33 (Trintae3)
  - NEON
  - OTB
  - SACHA

---

## Pastas Importantes para Consulta Rápida

| Área | Pasta | ID |
|------|-------|-----|
| Dados de Alunos | 1. Produtos | 1m0i53TKiGHtCC05zRKEc-snhyBZnmX75 |
| Exportação Kiwify | Dados Kiwify | 1i4CCfdMeQ2cafR73FIpDFMF-Xhdo-fA0 |
| TRINTAE3 Turma 6 | 2. Trintae3 - Turma 6 | 1CcCBCOGNSBAUbZCn9NP28GsyQuR9ojYd |
| TRINTAE3 Turma 5 | 1. Trintae3 - Turma 5 | 1jpWJ_pYCbvYmfOXUxOaIfekHNfQYGXWy |
| Comercial | 3. Comercial | 1E4skSGKOcoOHUkildtRoss8byiqrAv_H |
| Projetos/Lançamentos | 2. Projetos | 1677oxLtcN_ZIgAny0nA1mImtFs005gdT |

---

## Busca Vetorial (Qdrant RAG)

**Servidor:** http://31.97.170.4:6333
**Collection:** grupous_drive

**Comandos:**
```bash
# Inicializar
node /root/clawd/scripts/rag-drive.js init

# Indexar arquivos do Drive
node /root/clawd/scripts/drive-indexer.js

# Buscar documentos
node /root/clawd/scripts/rag-drive.js search "query aqui"

# Ver estatísticas
node /root/clawd/scripts/rag-drive.js stats
```
