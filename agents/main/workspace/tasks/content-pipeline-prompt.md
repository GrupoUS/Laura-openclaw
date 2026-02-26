# Task #21 — Dashboard: Content Pipeline (Kanban de Produção de Conteúdo)

## Contexto
Criar nova rota `/content` no dashboard do Grupo US. Pipeline de produção de conteúdo
estilo Kanban com todas as etapas — da ideia ao conteúdo publicado. Maurício e Laura
devem poder criar e mover cards colaborativamente.

## Referência Visual
Roman.Knox — "Content Pipeline" screen:
- Kanban dark mode com colunas coloridas
- Cards com contadores de itens por coluna
- Cards expansíveis com conteúdo completo (script, imagens, notas)
- Botão "+" por coluna para adicionar item
- Header com nome da página e breadcrumb: Ideas → Scripts → Thumbnails → Published

## Stack
- React 19 + TypeScript
- @dnd-kit/core + @dnd-kit/sortable (JÁ INSTALADO) para drag-and-drop
- NeonDB (Drizzle ORM) para persistência dos cards
- tRPC para CRUD
- Tailwind CSS 4

## Colunas do Pipeline
| Coluna | Cor | Ícone | Descrição |
|--------|-----|-------|-----------|
| Ideias | purple | 💡 | Ideias brutas — qualquer coisa que pode virar conteúdo |
| Roteiro | blue | ✍️ | Script completo escrito e aprovado |
| Thumbnail | yellow | 🖼️ | Thumbnail criada e aprovada |
| Gravação | orange | 🎬 | Vídeo gravado, aguardando edição |
| Edição | red | ✂️ | Em edição |
| Publicado | green | ✅ | Publicado no canal |

## Schema do banco de dados (Drizzle)
```typescript
// src/server/db/schema.ts — adicionar:
export const contentCards = pgTable('content_cards', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  script: text('script'),           // Script completo inline
  stage: text('stage').notNull().default('ideas'), // ideas|roteiro|thumbnail|gravacao|edicao|publicado
  position: integer('position').default(0),        // Ordem dentro da coluna
  assignedTo: text('assigned_to'),                 // agentId
  thumbnailUrl: text('thumbnail_url'),
  videoUrl: text('video_url'),
  publishedUrl: text('published_url'),
  tags: text('tags').array().default([]),
  createdBy: text('created_by').notNull().default('main'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

## Migration
```sql
-- migrations/XXXX_content_cards.sql
CREATE TABLE IF NOT EXISTS content_cards (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  script TEXT,
  stage TEXT NOT NULL DEFAULT 'ideas',
  position INTEGER DEFAULT 0,
  assigned_to TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  published_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## tRPC Router: contentCards
```typescript
// src/server/routers/content.ts
// Endpoints:
// content.list — todos os cards, agrupados por stage
// content.create — criar novo card
// content.update — mover coluna, editar conteúdo
// content.delete — excluir card
// content.reorder — reordenar dentro da coluna (drag-and-drop)
```

## Layout do Kanban
```
┌──────────────────────────────────────────────────────────────┐
│  Content Pipeline                                             │
│  Ideas → Scripts → Thumbnails → Filming → Editing → Published│
├──────┬──────┬──────┬──────┬──────┬────────────────────────── │
│ 💡   │ ✍️   │ 🖼️   │ 🎬   │ ✂️   │ ✅                       │
│Ideas │Roteiro│Thumb│Grav. │Edição│Publicado                  │
│  3   │  2   │  1   │  0   │  0   │  0                        │
├──────┼──────┼──────┼──────┼──────┼───────────────────────────│
│[Card]│[Card]│[Card]│      │      │                           │
│      │      │  +   │  +   │  +   │  +                        │
│  +   │  +   │      │      │      │                           │
└──────┴──────┴──────┴──────┴──────┴───────────────────────────┘
```

## Card Component
```tsx
<ContentCard>
  <CardHeader>
    <Title editable />
    <StageBadge />
    <AssignedAvatar />
  </CardHeader>
  <CardBody>
    <Description />         {/* texto curto */}
    <ScriptToggle>          {/* expandível */}
      <ScriptEditor />      {/* textarea markdown */}
    </ScriptToggle>
    <TagsList />
  </CardBody>
  <CardFooter>
    <CreatedBy />
    <MoveButtons />         {/* → próxima coluna */}
  </CardFooter>
</ContentCard>
```

## Drag-and-Drop (dnd-kit)
- DndContext envolvendo todo o board
- Cada coluna é um SortableContext
- handleDragEnd → chama `trpc.content.reorder` para persistir a nova posição

## Funcionalidade para Laura (IA)
- Laura pode criar cards via API call ao tRPC (ex: ao identificar ideia em conversa com Maurício)
- Campo `createdBy` indica se foi Laura ou Maurício
- Cards criados por Laura têm badge especial "✨ AI"

## Arquivos a criar
1. `src/client/routes/content.tsx` — componente principal do Kanban
2. `src/client/components/dashboard/content/KanbanColumn.tsx`
3. `src/client/components/dashboard/content/ContentCard.tsx`
4. `src/client/components/dashboard/content/ScriptEditor.tsx`
5. `src/client/components/dashboard/content/CreateCardModal.tsx`
6. `src/server/routers/content.ts` — router tRPC
7. `src/server/db/schema.ts` — adicionar tabela `content_cards`
8. Migration SQL

## Adicionar no menu lateral
Item "Content" com ícone `Film` ou `LayoutGrid` (lucide-react).

## Quality gates
- `bun run type-check` sem erros
- `bun run lint:check` sem warnings
- Drag-and-drop funcional (testar movendo cards entre colunas)
- Nenhum `any` explícito
- NUNCA usar npm/yarn/pnpm — apenas `bun`
