# Fedy Add Hooks Command

Add verification hooks to customize how tasks are validated.

## Prerequisites

Before running this command, ensure:
1. A Fedy project exists (run `fedy-init` first if not)

## Supported Hooks

| Hook | File | Description |
|------|------|-------------|
| `verify-task` | `hooks/verify-task.md` | Runs after task implementation to verify changes |

## Default Verification Steps

Every task must run these three checks so that everything passes before a task is marked complete:

1. **Lint** – enforce code style and catch common issues  
2. **TypeScript** – type-check (e.g. `tsc --noEmit` or project script)  
3. **Testing** – run the test suite  

Use the project’s existing scripts (e.g. `npm run lint`, `npm run typecheck`, `npm test`, or `bun test`). If the project doesn’t define a script, use the appropriate CLI (e.g. `npx tsc --noEmit` for TypeScript).

## Execution Steps

### 1. Create Hooks Folder

If it doesn’t exist, create:
```
fedy/<projectName>-fedy/hooks/
```

### 2. Resolve Verification Commands

Infer from the project (e.g. `package.json` scripts) the commands for:
- **Lint** – e.g. `npm run lint`, `bun run lint`, or `npx eslint .`
- **TypeScript** – e.g. `npm run typecheck`, `npx tsc --noEmit`, or `bun run typecheck`
- **Test** – e.g. `npm test`, `bun test`, or `npm run test`

Optionally prompt the user:
> "Use these verification steps after each task: lint, TypeScript, tests. Customize? (y/n)"  
> If yes: "Add or replace steps (e.g., build, format): …"

### 3. Create verify-task.md

Create `hooks/verify-task.md` so that **at least** lint, TypeScript, and testing run, in that order. Use this structure:

```markdown
# Verify Task Hook

Run these verification steps after completing a task. Every task must pass lint, TypeScript, and tests.

## Steps

<!-- Each step runs in order. All must pass before task is marked complete. -->

1. **Lint**
   ```bash
   <lint command from project, e.g. npm run lint or npx eslint .>
   ```
   - Success: exit code 0
   - On failure: fix issues and retry

2. **TypeScript (type-check)**
   ```bash
   <type-check command from project, e.g. npx tsc --noEmit or npm run typecheck>
   ```
   - Success: exit code 0
   - On failure: fix issues and retry

3. **Tests**
   ```bash
   <test command from project, e.g. npm test or bun test>
   ```
   - Success: exit code 0
   - On failure: fix issues and retry

## Notes

- All steps must pass before the task can be marked complete
- If a step fails, fix the issues and re-run verification
```


## Output

After creating the hook, display:

> "Created hooks/verify-task.md
> 
> Verification steps (every task must pass):
> 1. Lint
> 2. TypeScript (type-check)
> 3. Tests
> 
> These steps will run after each `fedy-do-task` completion."

## Final Structure

After adding hooks:

```
fedy/<projectName>-fedy/
├── plan.md
├── hooks/
│   └── verify-task.md
├── tasks/
│   └── 0.task.md
└── architecture/
    └── high-level-design.md
```

## Updating Hooks

To modify verification steps, either:
- Run `fedy-add-hooks` again (will ask to overwrite)
- Edit `hooks/verify-task.md` directly
