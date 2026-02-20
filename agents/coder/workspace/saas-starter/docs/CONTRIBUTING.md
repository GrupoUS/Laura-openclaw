# Contributing Guide

## Development Workflow

1.  **Fork & Clone**: Clone the repository to your local machine.
2.  **Install**: Use `bun install` (strictly enforced).
3.  **Database**:
    - For local dev, use SQLite: `bun run db:switch:sqlite`.
    - Run `bun prisma db push` to sync schema.
4.  **Dev Server**: `bun dev`.

## Code Standards

- **Formatting**: We use Prettier (via Ultracite/Biome patterns).
- **Linting**: ESLint is configured. Run `bun run lint` before committing.
- **Testing**:
    - Unit tests: `bun run test` (Vitest).
    - Write tests for all new UI components in `src/components/*.test.tsx`.

## Pull Requests

1.  Create a feature branch: `git checkout -b feature/my-new-feature`.
2.  Commit changes using Conventional Commits (e.g., `feat: add dark mode toggle`).
3.  Ensure CI passes (Lint + Build + Test).
4.  Open PR against `main`.

## Database Changes

If you modify `prisma/schema.prisma`:
1.  Run `bun prisma generate` to update the client types.
2.  Run `bun prisma db push` to update your local DB.
3.  Do NOT commit `dev.db`.

## Adding Dependencies

Always use `bun add <package>`. Do not use `npm` or `yarn` to avoid lockfile conflicts.
