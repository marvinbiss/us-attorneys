---
name: sprint
description: Plan and execute a sprint with parallel agents using Boris Cherny methodology — worktrees, quality gates, verification.
user_invocable: true
---

# Sprint Execution

## Phase 1: Plan (MANDATORY)
Before launching ANY agents:
1. Read CLAUDE.md quality gates
2. Read relevant migration files for the sprint's scope
3. Break work into independent, parallelizable tasks
4. Identify dependencies (migrations → API → components)
5. Present plan to user for approval

## Phase 2: Execute
For each agent:
- Use `isolation: "worktree"` for code changes
- Include in agent prompt:
  - The specific task and files to create/modify
  - Files to READ FIRST (migrations, existing routes, existing components)
  - The agent-checklist skill instructions
  - "Run `npx next build` before completing"

## Phase 3: Verify
After all agents complete:
1. Run `/quality-gate` (build + migration conflicts + DB validation + auth check + security scan)
2. Fix any issues found
3. Only then commit

## Phase 4: Commit
Single commit with clear message listing all changes.
