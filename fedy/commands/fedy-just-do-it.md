# Fedy Just Do It Command

Execute a pending task directly from plan.md without creating a detailed task file first.

**Use this for:** Fast iteration on simple, non-complex tasks where creating a full task file would be overhead.

**Use `fedy-do-task` instead when:** The task is complex, requires detailed planning, or you want the safety of a reviewed task file.

## Prerequisites

Before running this command, ensure:
1. A Fedy project exists (run `fedy-init` first if not)
2. A `plan.md` file exists with at least one pending task (`[ ]`)
3. The `architecture/high-level-design.md` file exists and is populated

## Task Status Reference

Tasks in `plan.md` use these status markers:
- `[ ]` **Pending** - Task idea, no task file yet
- `[~]` **Planning** - Task file is being created
- `[R]` **Ready** - Task file complete, ready for execution
- `[-]` **In Progress** - Being executed by an agent
- `[x]` **Completed** - Done

## Execution Steps

### Phase 1: Find and Select Task

#### 1.1 Scan plan.md for Pending Tasks
- Open `plan.md`
- Find all tasks marked with `[ ]` (Pending)
- If NO `[ ]` tasks found:
  - If there are `[R]` ready tasks: 
    > "No pending tasks. There are Ready tasks available - run `fedy-do-task` to execute them."
  - If there are only `[-]` in-progress or `[x]` completed:
    > "All tasks are either in progress or completed. Run `fedy-plan-next` to add more tasks."
  - **STOP** - do not proceed if no `[ ]` tasks

#### 1.2 Check Dependencies
For each `[ ]` Pending task:
- Check if task has `| depends:` notation in plan.md
- Verify all prerequisite tasks are marked `[x]` Completed in plan.md
- If any prerequisite is NOT completed, the task is **blocked**
- Build list of **executable tasks** (pending + all dependencies satisfied)

#### 1.3 Check File Conflicts (for parallel safety)
For each executable task:
- Estimate which files the task will modify based on its description
- Check if any `[-]` In Progress tasks are likely modifying the same files
- If conflict is likely, mark this task as **blocked by file conflict**

#### 1.4 Select Task
If **one or more tasks** are executable (no blocks):
> Proceed with the **first available task** automatically (by order in plan.md)

If **zero tasks** are executable (all blocked):
> "All pending tasks are blocked:
> - Task A: Waiting for 'Task X' to complete
> - Task B: Likely file conflict with in-progress 'Task Y'
>
> Wait for in-progress tasks to complete, or run `fedy-do-task` on a Ready task."
> **STOP** - do not proceed

#### 1.5 Mark Task as In Progress
Before starting execution:
- Update `plan.md`: change `[ ]` to `[-]` for the selected task
- This prevents other agents from picking this task

### Phase 2: Preparation

#### 2.1 Read the Architecture
- Open `architecture/high-level-design.md`
- Understand the design patterns, component structure, and constraints
- Ensure implementation will follow the design

#### 2.2 Read Implementation Rules
- Check if `rules/implementation-rules.md` exists
- If it exists, read all rules
- Keep these rules in mind during implementation
- If it does NOT exist, continue without rules (no warning needed)

#### 2.3 Quick Context Scan
- Identify relevant existing files related to the task
- Note coding conventions, patterns, and styles in use
- Find existing tests to understand testing patterns

#### 2.4 Check for Verification Hook
- Check if `hooks/verify-task.md` exists
- If it exists, read the verification steps
- If it does NOT exist, warn the user:
  > "No verify-task hook found. Run `fedy-add-hooks` to configure verification steps."
  > Continue without automated verification, or stop and let user add hooks first.

#### 2.5 Install Dependencies (if needed)
If the task requires new packages:
- Install required packages using the project's package manager
- Example: `npm install <package>` or `pip install <package>`

### Phase 3: Implementation

#### 3.1 Analyze and Plan (In-Memory)
Before coding, mentally break down the task:
- What files need to be created or modified?
- What are the implementation steps?
- What tests are needed?

This is done inline without creating a task file.

#### 3.2 Execute the Implementation
- Implement the task following the high-level design
- Make the minimal changes required to complete the task
- Follow existing patterns in the codebase

#### 3.3 Follow Existing Patterns
- Match the coding style of existing files
- Use the same import patterns
- Follow the same file/folder structure

#### 3.4 Add Tests
Add appropriate tests:
- Follow existing test patterns and naming conventions
- Cover the main functionality
- Keep tests focused and atomic

#### 3.5 Add Logging
Add meaningful logs to help Fedy agents debug issues:
- Log at entry/exit points of important functions
- Log key decision points and branch conditions
- Log errors with context
- Use appropriate log levels (error, warn, info, debug)
- Follow existing logging patterns in the codebase

### Phase 4: Verification

Run verification steps defined in `hooks/verify-task.md`.

#### 4.1 Check for Hook
- If `hooks/verify-task.md` does NOT exist, skip automated verification
- Warn user and proceed to completion (or ask if they want to add hooks first)

#### 4.2 Execute Hook Steps
- Read `hooks/verify-task.md`
- Execute each step in order as defined in the hook
- Each step must pass (exit code 0) before proceeding to the next

#### 4.3 Fix Issues
- If any step fails, fix the issues
- Re-run the failing step
- Repeat until all steps pass

#### 4.4 Verification Complete
- All steps from `verify-task.md` passed
- Ready to proceed to completion

### Phase 5: Completion

#### 5.1 Update Task Status
Mark the task as complete in plan.md:
- Change `[-]` to `[x]`:
```markdown
- [x] The task that was just completed
```

This unlocks any tasks that depend on this one.

#### 5.2 Prepare Commit
Ask user if approves and if yes stage and commit. If not, fix issues first.

Stage all changes and suggest a commit message:

```bash
git add .
git commit -m "<type>: <description>"
```

Commit message format:
- `feat:` - new feature
- `fix:` - bug fix
- `refactor:` - code refactoring
- `test:` - adding tests
- `docs:` - documentation
- `chore:` - maintenance

#### 5.3 Summary
Display what was accomplished:

> "Task completed: <task description>
> 
> Changes made:
> - Created/Modified: file1.ts
> - Created/Modified: file2.ts
> - Added tests: file1.test.ts
> 
> Verification (from hooks/verify-task.md):
> - Step 1: ✓
> - Step 2: ✓
> - Step 3: ✓
> 
> Changes committed: `<commit hash>`
> 
> Tasks now unblocked by this completion: <list any tasks that depended on this one>
> 
> Run `fedy-just-do-it` for another quick task, or `fedy-plan-task` for complex tasks."

## Important Rules

1. **Follow the design** - Never deviate from high-level-design.md
2. **One task, one commit** - Never combine multiple tasks
3. **Keep it simple** - This command is for non-complex tasks
4. **Tests are recommended** - Add tests appropriate to the change
5. **Hook verification must pass** - All steps in `hooks/verify-task.md` must pass
6. **Minimal changes** - Only change what's needed for the task
7. **No improvisation** - If the task is unclear, ask the user, don't guess
8. **Add meaningful logs** - Log important operations for debugging
9. **Only execute Pending tasks** - Only pick up tasks marked `[ ]` in plan.md
10. **Mark status immediately** - Change to `[-]` before starting, `[x]` when done
11. **Check dependencies** - Verify prerequisite tasks are completed before starting
12. **Know when to switch** - If the task is too complex, stop and use `fedy-plan-task` + `fedy-do-task` instead
13. **Respect implementation rules** - Follow all rules in `rules/implementation-rules.md`

## When to Use fedy-do-task Instead

Switch to the full `fedy-plan-task` + `fedy-do-task` flow when:
- The task touches more than 3-4 files
- The task requires significant architectural decisions
- The implementation approach is unclear
- You want a reviewed plan before executing
- The task has complex dependencies or edge cases
- Multiple agents need to understand the task

## Error Handling

### No Pending Tasks
> "No pending tasks found (`[ ]`). 
> - Run `fedy-plan-next` to add new tasks to plan.md.
> - Or run `fedy-do-task` if there are Ready tasks."

### All Tasks Completed
> "All planned tasks are completed. Run `fedy-plan-next` to add more tasks to plan.md."

### Task Blocked by Dependencies
> "Task '<name>' is blocked. Prerequisite tasks not completed:
> - [ ] <prerequisite task 1>
> - [-] <prerequisite task 2> (in progress)
> 
> Wait for dependencies to complete or choose a different task."

### Task Blocked by File Conflict
> "Task '<name>' likely conflicts with in-progress task:
> - '<other task>' may be modifying related files
> 
> Wait for the other task to complete or confirm no conflict."

### No Verify Hook
> "No hooks/verify-task.md found. Run `fedy-add-hooks` to configure verification."

### Verification Failures
If hook steps fail after 3 fix attempts:
> "Unable to resolve verification errors. Please review manually:
> - [List of failing steps and errors]"

### Task Too Complex
If during implementation the task proves too complex:
> "This task is more complex than expected. Recommend switching to full planning:
> 1. Revert status to `[ ]` in plan.md
> 2. Run `fedy-plan-task` to create a detailed task file
> 3. Run `fedy-do-task` to execute with the full plan
>
> Should I switch to the full planning flow?"

### Execution Failure - Rollback Status
If task execution fails and cannot be recovered:
- Change plan.md status back to `[ ]`
- Inform user of the failure so they can investigate

## Comparison: fedy-just-do-it vs fedy-do-task

| Aspect | fedy-just-do-it | fedy-do-task |
|--------|-----------------|--------------|
| **Input** | Pending `[ ]` task in plan.md | Ready `[R]` task with task file |
| **Planning** | Inline, in-memory | Detailed task file created first |
| **Speed** | Faster, less overhead | Slower, more thorough |
| **Best for** | Simple, clear tasks | Complex, multi-step tasks |
| **Traceability** | Just the commit | Task file + commit |
| **Collaboration** | Single agent | Multi-agent safe |
