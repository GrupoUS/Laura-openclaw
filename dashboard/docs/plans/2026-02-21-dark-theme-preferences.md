# Plan — Feature K

**Goal:** Adicionar dark mode completo ao dashboard com troca suave entre sistema/light/dark, sidebar que colapsa para ícones, compact mode para densificar o Kanban — tudo persistido no cookie iron-session para que as preferências sobrevivam a refreshes sem FOUC.

**Architecture:** `next-themes` injeta o script de detecção de tema **antes** do primeiro render via `suppressHydrationWarning` no `<html>` — eliminando o flash. O `ThemeProvider` envolve o layout raiz. Dark mode funciona via `darkMode: ['class']` no Tailwind (já configurado desde Feature A) + CSS variables no `globals.css`. Preferências não relacionadas a tema (sidebar colapsada, compact mode, view padrão) ficam no iron-session via `PATCH /api/preferences`. Recharts recebe cores dinamicamente via `useTheme()`.

**Complexity:** L6 — setup `next-themes`, ~14 arquivos modificados com `dark:` variants, novo `PreferencesSheet`, sidebar colapsável com estado server-hydrated.
