# Planning Patterns for Atomic Execution

To ensure reliable code execution, plans must be broken down into atomic, testable units.

## Atomic Task Structure

Every task should represent a single, independent change that can be verified.

- **Title**: Action-oriented (e.g., "Implement user login endpoint")
- **Description**: What to do and why
- **Verification/Tests**: How to prove it works
- **Size**: S (< 30 min) | M (1-3 hrs) | L (3-8 hrs)

---

## Complexity Indicators

### When to Increase Complexity

| Factor                      | Impact |
| --------------------------- | ------ |
| Multiple files affected     | +1     |
| Database changes required   | +1     |
| Authentication involved     | +1     |
| Third-party APIs            | +1     |
| Breaking changes possible   | +2     |
| Security implications       | +2     |
| Multi-service coordination  | +2     |

### When to Decrease Complexity

| Factor                         | Impact |
| ------------------------------ | ------ |
| Well-established patterns      | -1     |
| Similar code in codebase       | -1     |
| Isolated, no dependencies      | -1     |
| Comprehensive tests exist      | -1     |

---

## Test Patterns

- **Unit Tests**: Test logic in isolation
- **Integration Tests**: Test interaction between components
- **End-to-End Tests**: Test the full user flow
- **Snapshot Tests**: Verify UI doesn't regress

---

## Atomic Subtasks

Break large tasks into subtasks that take < 2 hours to implement.

### Example: "Implement user login"

1. **[S] Define login schema** — Zod/TypeBox validation
2. **[S] Create login database query** — Find user by email
3. **[S] Implement password hashing** — bcrypt utility
4. **[M] Create login route handler** — POST /api/auth/login
5. **[S] Add unit tests** — Test route handler

### Example: "Add dashboard analytics"

1. **[S] Define analytics schema** — Database table
2. **[M] Create analytics router** — CRUD endpoints
3. **[M] Build analytics card component** — Chart display
4. **[S] Integrate with dashboard** — Add to layout
5. **[S] Add loading states** — Skeleton components

---

## Rollback Patterns

Every task should have a clear rollback path:

### Code Changes

```bash
# Single file
git checkout path/to/file.ts

# Multiple files
git stash
# or
git reset --hard HEAD~1
```

### Database Changes

```sql
-- If adding column
ALTER TABLE users DROP COLUMN new_column;

-- If creating table
DROP TABLE IF EXISTS new_table;
```

### New Files

```bash
rm path/to/new/file.ts
```

---

## Dependency Mapping

Before executing, map dependencies:

```
AT-001: Create schema
  └── AT-002: Create database table (depends on AT-001)
      └── AT-003: Create API router (depends on AT-002)
          └── AT-004: Create UI component (depends on AT-003)

AT-005: Add styles (independent, can run parallel)
```

### Parallel-Safe Tasks

Mark with ⚡ when:
- No shared file modifications
- No dependency chain
- Independent validation

---

## Validation Commands

| Phase     | Command           | Purpose              |
| --------- | ----------------- | -------------------- |
| TypeCheck | `bun run check`   | Type safety          |
| Lint      | `bun run lint`    | Code style           |
| Build     | `bun run build`   | Compilation          |
| Test      | `bun test`        | Unit tests           |
| E2E       | `bun test:e2e`    | End-to-end tests     |
