# Naming Conventions & Priority Definitions

## Branch Naming

Branches follow the pattern: `<type>/<short-description>`

| Type | Use Case | Example |
|------|----------|---------|
| `feature/` | New feature or capability | `feature/jpa-repository-setup` |
| `fix/` | Bug fix | `fix/user-game-status-null` |
| `refactor/` | Code restructuring without behavior change | `refactor/extract-dto-mapper` |
| `docs/` | Documentation only | `docs/api-endpoints` |
| `chore/` | Maintenance, dependencies, CI | `chore/bump-spring-boot-3.4` |

**Rules:**
- Use lowercase and hyphens
- Keep description short (2-5 words)
- No ticket numbers in branch names (use PR description for that)

## Commit Messages

Follow Conventional Commits: `<type>: <description>`

| Type | Description |
|------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `docs:` | Documentation only |
| `chore:` | Maintenance, dependencies, tooling |
| `test:` | Adding or correcting tests |
| `style:` | Formatting, semicolons, etc (no logic change) |
| `perf:` | Performance improvement |

**Rules:**
- Imperative mood: "add feature" not "added feature"
- 72 chars max for subject line
- Include scope when clear: `feat(steam): add import endpoint`
- Sign-off line: `Co-Authored-By: giosuetedeschi-spec <giosue.tedeschi@edu-its.it>`

## Pull Request Naming

Format: `[TYPE] Short description`

Examples:
- `[FEAT] JPA repositories for all entities`
- `[FIX] UserGame status validation`
- `[DOCS] API documentation`

## Priority Definitions

| Priority | Label | Meaning | SLA |
|----------|-------|---------|-----|
| **P0** | `critical` | Blocking, must be done before other work | Immediate |
| **P1** | `important` | Required for core functionality | This sprint |
| **P2** | `nice-to-have` | Enhances UX but not blocking | Backlog |

**Rules for assigning priority:**
- If a task is a prerequisite for other P0 tasks → P0
- If a task implements a core user flow → P1
- If a task is polish or enhancement → P2
- Database and authentication foundations are always P0

## Issue Labels

| Label | Color | Use When |
|-------|-------|----------|
| `backend` | 🔵 Blue | Spring Boot / API change |
| `frontend` | 🟢 Green | React / UI change |
| `database` | 🟡 Yellow | Schema / query change |
| `blocked` | 🔴 Red | Depends on another issue |
| `good-first-issue` | 🟣 Purple | Suitable for newcomers |
| `tech-debt` | ⚫ Black | Refactoring needed |

---

## Git Workflow

```
1. Create branch from latest main (or bobu-branch for ArcheType)
2. Make atomic commits (one logical change per commit)
3. Push branch and create PR
4. Reference related issue numbers in PR: "Closes #22"
5. Review, then merge
```

**Commit often** — each logical unit of work should be committed. Don't accumulate changes.
