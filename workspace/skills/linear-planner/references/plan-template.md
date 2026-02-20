# Linear Issue Template

Template for creating well-structured Linear issues in the Benício project.

---

## Parent Issue Template

```markdown
# [Type] Title

## Objective

Brief description of what needs to be accomplished and why.

## Context

- Related files: `path/to/file.ts`
- Dependencies: [any external dependencies]
- Impact: [what systems/features affected]

## Acceptance Criteria

- [ ] Criterion 1 (measurable)
- [ ] Criterion 2 (verifiable)
- [ ] Criterion 3 (specific)

## Subtasks

1. **[S] Subtask 1** — Brief description
2. **[M] Subtask 2** — Brief description
3. **[S] Subtask 3** — Brief description

## Validation

- Build passes: `bun run build`
- Tests pass: `bun test`
- Manual verification: [steps if needed]

## Rollback

If something goes wrong:
1. [Rollback step 1]
2. [Rollback step 2]
```

---

## Subtask Template

```markdown
# [Size] Action + Target

## What

Specific action to perform.

## How

1. Step 1
2. Step 2
3. Step 3

## Verification

- [ ] Expected outcome achieved
- [ ] No regressions introduced

## Files

- Create: `path/to/new.ts`
- Modify: `path/to/existing.ts`
```

---

## Size Indicators

Use in subtask titles:

| Marker | Meaning    | Effort   |
| ------ | ---------- | -------- |
| [S]    | Small      | < 30 min |
| [M]    | Medium     | 1-3 hrs  |
| [L]    | Large      | 3-8 hrs  |

---

## Type Prefixes

Use in parent issue titles:

| Prefix      | Use Case                    |
| ----------- | --------------------------- |
| [Feature]   | New functionality           |
| [Bug]       | Fix broken behavior         |
| [Refactor]  | Code improvement            |
| [Docs]      | Documentation updates       |
| [Chore]     | Maintenance, dependencies   |
| [Research]  | Investigation, planning     |

---

## Priority Guide

| Level  | When to Use                          |
| ------ | ------------------------------------ |
| Urgent | Blocking production, security issue  |
| High   | Important feature, affects users     |
| Normal | Standard work, scheduled tasks       |
| Low    | Nice-to-have, future improvements    |

---

## Example: Feature Issue

```markdown
# [Feature] Add user profile avatars

## Objective

Allow users to upload and display profile avatars in the dashboard.

## Context

- Related files: `client/src/components/UserProfile.tsx`
- Dependencies: Clerk user metadata
- Impact: User profile, navigation header

## Acceptance Criteria

- [ ] Users can upload avatar image
- [ ] Avatar displays in profile and header
- [ ] Default avatar for users without upload
- [ ] Image size/format validation

## Subtasks

1. **[S] Add avatar upload UI** — File input + preview
2. **[M] Implement upload handler** — Store in Clerk metadata
3. **[S] Display avatar in profile** — Use Clerk user image
4. **[S] Add avatar to header** — Update navigation component

## Validation

- Build passes: `bun run build`
- Manual: Upload image, verify display

## Rollback

1. Revert avatar-related commits
2. Remove uploaded images from storage
```
