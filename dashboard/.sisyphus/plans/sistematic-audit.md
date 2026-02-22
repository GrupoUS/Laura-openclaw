## Fix Registry — NeonDash Systematic Audit

| # | Severity | Category | File:Line | Issue | Root Cause | Fix Summary |
|---|----------|----------|-----------|-------|------------|-------------|
| 1 | P3 LOW   | Database | `src/server/db/schema.ts` | Missing FK Index | `driveChannels` has `accountId` FK without an index. | Add `index().on(table.accountId)` |
| 2 | P3 LOW   | Database | `src/server/db/schema.ts` | Missing FK Index | `files` has `accountId` FK without an index. | Add `index().on(table.accountId)` |
| 3 | P3 LOW   | Database | `src/server/db/schema.ts` | Missing FK Index | `subtasks` has `taskId` FK without an index. | Add `index().on(table.taskId)` |
| 4 | P3 LOW   | Database | `src/server/db/schema.ts` | Missing FK Index | `taskEvents` has `taskId` FK without an index. | Add `index().on(table.taskId)` |

Total CRITICAL: 0 | HIGH: 0 | MEDIUM: 0 | LOW: 4

### Pre-Mortem (Anti-Regressão)

| # | Risco | Mitigação |
|---|-------|-----------|
| 1 | `db:push` falhar na NeonDB devido a timeouts | Executar verificação `type-check` antes, e certificar conexão estável com o banco. |
| 2 | O banco já ter esses indexes (criados manualmente) | Verificar a diff ou usar idex com nomes bem padronizados como `idx_drivechannels_accountid`. |

### Implementation Instructions
The user has requested to automatically fix all problems discovered ("arrume todos os erros encontrados na implementacao e fix all"). Since 0 errors failed `type-check` and `lint:check`, our primary fixes are the P3 missing FK indexes which ensure optimal database performance. I will update `src/server/db/schema.ts` and push directly.
