# Fedy Do Task Command

Execute the next planned task from the tasks folder.

## Prerequisites

Before running this command, ensure:
1. A Fedy project exists (run `fedy-init` first if not)
2. A task plan exists in the `tasks/` folder (run `fedy-plan-task` first if not)
3. The task is marked `[R]` Ready in `plan.md`

## Task Status Reference

Tasks in `plan.md` use these status markers:
- `[ ]` **Pending** - Task idea, no task file yet (needs `fedy-plan-task`)
- `[~]` **Planning** - Task file is being created
- `[R]` **Ready** - Task file complete, ready for execution
- `[-]` **In Progress** - Being executed by an agent
- `[x]` **Completed** - Done

## Execution Steps

### Phase 1: Find Ready Tasks

#### 1.1 Scan plan.md for Ready Tasks
- Open `plan.md`
- Find all tasks marked with `[R]` (Ready)
- If NO `[R]` tasks found, check why:
  - If there are `[ ]` pending tasks: 
    > "No tasks ready for execution. Run `fedy-plan-task` to create a task file for a pending task."
  - If there are `[~]` planning tasks:
    > "Tasks are currently being planned. Wait for planning to complete or run `fedy-plan-task` for another pending task."
  - If there are only `[-]` in-progress or `[x]` completed:
    > "All planned tasks are either in progress or completed. Run `fedy-plan-next` to add more tasks."
  - **STOP** - do not proceed if no `[R]` tasks

#### 1.2 Check Dependencies
For each `[R]` Ready task:
- Read the task file and check `## Dependencies > Prerequisite Tasks`
- Also check if task has `| depends:` notation in plan.md
- Verify all prerequisite tasks are marked `[x]` Completed in plan.md
- If any prerequisite is NOT completed, the task is **blocked**
- Build list of **executable tasks** (ready + all dependencies satisfied)

#### 1.3 Check File Conflicts (for parallel safety)
For each executable task:
- Read the task file's `## Files to Modify/Create` section
- Check if any `[-]` In Progress tasks modify the same files
- If conflict exists, mark this task as **blocked by file conflict**

#### 1.4 Select Task
If **multiple tasks** are executable (no blocks):
> "Found X tasks ready for parallel execution:
> 1. [Task A] - Create product types
> 2. [Task B] - Create UI components
>
> These can run in parallel (no conflicts).
> Which task should I work on?"

If **one task** is executable:
> Proceed with that task automatically

If **zero tasks** are executable (all blocked):
> "All ready tasks are blocked:
> - Task A: Waiting for 'Task X' to complete
> - Task B: File conflict with in-progress 'Task Y'
>
> Wait for in-progress tasks to complete, or run another agent on a non-conflicting task."
> **STOP** - do not proceed

#### 1.5 Mark Task as In Progress
Before starting execution:
- Update `plan.md`: change `[R]` to `[-]` for the selected task
- Update the task file: change `- [R] Ready` to `- [-] In progress`
- This prevents other agents from picking this task

#### 1.6 Load the Task Plan
- Read the complete task file
- Parse the implementation plan:
  - Summary
  - Files to Modify/Create
  - Implementation Steps
  - Test Plan
  - Dependencies
  - Architecture Alignment

### Phase 2: Preparation

#### 2.1 Read the Architecture
- Open `architecture/high-level-design.md`
- Cross-reference with the task's Architecture Alignment section
- Ensure implementation will follow the design

#### 2.2 Read Implementation Rules
- Check if `rules/implementation-rules.md` exists
- If it exists, read all rules
- Keep these rules in mind during implementation
- If it does NOT exist, continue without rules (no warning needed)

#### 2.3 Check for Verification Hook
- Check if `hooks/verify-task.md` exists
- If it exists, read the verification steps
- If it does NOT exist, warn the user:
  > "No verify-task hook found. Run `fedy-add-hooks` to configure verification steps."
  > Continue without automated verification, or stop and let user add hooks first.

#### 2.4 Install Dependencies
If the task plan lists dependencies:
- Install required packages using the project's package manager
- Example: `npm install <package>` or `pip install <package>`

### Phase 3: Implementation

#### 3.1 Follow the Implementation Steps
- Execute each step from the task plan in order
- The task file contains detailed instructions for each step
- Follow the code patterns and snippets provided

#### 3.2 Follow Existing Patterns
- Match the coding style of existing files
- Use the same import patterns
- Follow the same file/folder structure

#### 3.3 Add Tests
Follow the Test Plan section from the task file:
- Create test files as specified
- Implement the key test cases listed
- Follow existing test patterns and naming conventions

#### 3.4 Add Logging
Add meaningful logs to help Fedy agents debug issues:
- Log at entry/exit points of important functions (e.g., API handlers, service methods)
- Log key decision points and branch conditions
- Log input parameters and return values for critical operations
- Log errors with context (what was being attempted, relevant IDs/data)
- Use appropriate log levels:
  - `error` - failures that need attention
  - `warn` - unexpected but handled situations
  - `info` - important business events (user actions, state changes)
  - `debug` - detailed technical information for troubleshooting
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
Mark the task as complete in both files:

**In the task file:**
```markdown
## Status
- [x] Completed
```

**In plan.md:**
Change `[-]` to `[x]`:
```markdown
- [x] The task that was just completed
```

This unlocks any tasks that depend on this one.

#### 5.3 Prepare Commit
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

#### 5.4 Summary
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
> Run `fedy-do-task` to execute another ready task, or `fedy-plan-task` to plan a pending one."

## Important Rules

1. **Follow the plan** - Execute exactly what's in the task file
2. **One task, one commit** - Never combine multiple tasks
3. **Tests are recommended** - Follow the Test Plan from the task file
4. **Hook verification must pass** - All steps in `hooks/verify-task.md` must pass
5. **Follow the design** - Never deviate from high-level-design.md
6. **Minimal changes** - Only change what's specified in the task plan
7. **No improvisation** - If the plan is unclear, ask the user, don't guess
8. **Add meaningful logs** - Log important operations so Fedy agents can easily diagnose issues
9. **Only execute Ready tasks** - Only pick up tasks marked `[R]` in plan.md
10. **Mark status immediately** - Change to `[-]` before starting, `[x]` when done
11. **Check dependencies** - Verify prerequisite tasks are completed before starting
12. **Respect implementation rules** - Follow all rules in `rules/implementation-rules.md`

## Error Handling

### No Ready Tasks
> "No tasks ready for execution (`[R]`). 
> - Run `fedy-plan-task` to create a task file for a pending task.
> - Or wait for in-progress planning to complete."

### All Tasks Completed
> "All planned tasks are completed. Run `fedy-plan-next` to add more tasks to plan.md."

### Task Blocked by Dependencies
> "Task '<name>' is blocked. Prerequisite tasks not completed:
> - [ ] <prerequisite task 1>
> - [-] <prerequisite task 2> (in progress)
> 
> Wait for dependencies to complete or work on a different task."

### Task Blocked by File Conflict
> "Task '<name>' cannot start - file conflict with in-progress task:
> - '<other task>' is modifying: <file path>
> 
> Wait for the other task to complete."

### No Verify Hook
> "No hooks/verify-task.md found. Run `fedy-add-hooks` to configure verification."

### Verification Failures
If hook steps fail after 3 fix attempts:
> "Unable to resolve verification errors. Please review manually:
> - [List of failing steps and errors]"

### Task Plan Unclear
If the implementation steps are ambiguous:
> "Task plan unclear at step X. Please clarify the following:
> - [Specific question about the plan]"

### Execution Failure - Rollback Status
If task execution fails and cannot be recovered:
- Change task file status back to `- [R] Ready`
- Change plan.md status back to `[R]`
- Inform user of the failure so they can investigate
