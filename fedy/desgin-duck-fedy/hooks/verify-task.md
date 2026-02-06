# Verify Task Hook

Run these verification steps after completing a task.

## Steps

<!-- Each step runs in order. All must pass before task is marked complete. -->

1. **Type Check**
   ```bash
   cd /Users/matanco/MyRepos/desgin-duck && bun x tsc --noEmit
   ```
   - Success: exit code 0
   - On failure: fix TypeScript errors and retry

2. **Run Tests**
   ```bash
   cd /Users/matanco/MyRepos/desgin-duck && bun test
   ```
   - Success: exit code 0 (or no tests found)
   - On failure: fix failing tests and retry

3. **Build**
   ```bash
   cd /Users/matanco/MyRepos/desgin-duck && bun run build
   ```
   - Success: exit code 0, dist/ files created
   - On failure: fix build errors and retry

## Notes

- All steps must pass before the task can be marked complete
- If a step fails, fix the issues and re-run verification
- Type check catches errors before runtime
- Tests ensure functionality works as expected
- Build ensures the CLI can be distributed
