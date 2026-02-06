# Fedy Plan Task Command

Create a detailed implementation plan for the next pending task from `plan.md`.

## Prerequisites

Before running this command, ensure:
1. A Fedy project exists (run `fedy-init` first if not)
2. The `plan.md` file has at least one pending task (`- [ ]`)
3. The `architecture/high-level-design.md` file exists and is populated

## Task Status Reference

Tasks in `plan.md` use these status markers:
- `[ ]` **Pending** - Task idea, no task file yet
- `[~]` **Planning** - `fedy-plan-task` is creating the task file
- `[R]` **Ready** - Task file complete, ready for execution
- `[-]` **In Progress** - Being executed by an agent
- `[x]` **Completed** - Done

## Execution Steps

### Phase 1: Context Gathering

#### 1.1 Read the Plan and Mark as Planning
- Open `plan.md` and find the **first pending task** (`- [ ]`)
- If no pending tasks exist, inform the user:
  > "No pending tasks in plan.md. Run `fedy-plan-next` to add new tasks."
- **Immediately mark the task as `[~]` Planning** in `plan.md`
  - This prevents other agents from planning the same task
  - Change `- [ ] Task description` to `- [~] Task description`

#### 1.2 Read the Architecture
- Open `architecture/high-level-design.md`
- Understand the system design, patterns, and constraints
- All planning MUST adhere to this design

#### 1.3 Read Implementation Rules
- Check if `rules/implementation-rules.md` exists
- If it exists, read all rules
- Note any rules relevant to this task
- The task plan should incorporate these rules
- If it does NOT exist, continue without rules (no warning needed)

#### 1.4 Scan the Codebase
- Identify relevant existing files related to the task
- Note coding conventions, patterns, and styles in use
- Find existing tests to understand testing patterns

### Phase 2: Determine Task Number

#### 2.1 Count Existing Tasks
- Scan the `tasks/` folder for existing task files
- Task files follow the pattern: `<number>.<task-name>.md`
- Find the highest numbered task file
- The new task number = highest + 1

#### 2.2 Generate Task Filename
- Create a URL-safe task name from the task description:
  - Lowercase all letters
  - Replace spaces with hyphens
  - Remove special characters
  - Truncate to max 50 characters
- Final filename: `<number>.<task-name>.md`
- Example: `1.create-user-model.md`, `2.add-login-endpoint.md`

### Phase 3: Create Implementation Plan

#### 3.1 Break Down the Task
Create a detailed implementation plan covering:

1. **Task Summary**
   - The original task description from plan.md
   - High-level goal and expected outcome

2. **Files to Modify/Create**
   - List all files that need to be created or modified
   - Explain what changes are needed in each file

3. **Implementation Steps**
   - Ordered list of specific coding steps
   - Each step should be atomic and clear
   - Include code snippets or patterns to follow

4. **Test Plan**
   - What tests need to be written
   - Test file locations following project conventions
   - Key test cases to cover

5. **Dependencies**
   - **Prerequisite Tasks**: Tasks that must be `[x]` Completed before this one can start
   - **Package Dependencies**: Any new npm/pip packages needed
   - Parse the `| depends:` notation from the task in `plan.md` if present

6. **Alignment with Architecture**
   - How this task fits the high-level design
   - Any patterns from the design to follow

7. **Relevant Implementation Rules** (if any exist)
   - List any rules from `rules/implementation-rules.md` that apply to this task
   - Include the rule title and a brief reminder of what to do/avoid

### Phase 4: Write Task File

#### 4.1 Create the Task File
Write the implementation plan to `tasks/<number>.<task-name>.md`:

```markdown
# Task <number>: <Original Task Description>

## Status
- [R] Ready

## Summary
<High-level goal and expected outcome>

## Files to Modify/Create
- `path/to/file1.ts` - <description of changes>
- `path/to/file2.ts` - <description of changes>
- `path/to/newfile.ts` - <description - new file>

## Implementation Steps

### Step 1: <Step Title>
<Detailed description>
```<language>
// Code snippet or pattern to follow
```

### Step 2: <Step Title>
<Detailed description>

... (continue for all steps)

## Test Plan
- [ ] `path/to/test1.test.ts` - <test description>
- [ ] `path/to/test2.test.ts` - <test description>

### Key Test Cases
1. <Test case description>
2. <Test case description>

## Dependencies

### Prerequisite Tasks
<!-- Tasks from plan.md that must be [x] Completed first -->
- <Task name from plan.md>
- Or: "None"

### Package Dependencies
- <package name> - <reason>
- Or: "No new packages required"

## Architecture Alignment
<How this fits the high-level design>

## Relevant Implementation Rules
<!-- List rules from rules/implementation-rules.md that apply to this task -->
- <Rule title> - <Brief reminder of what to do/avoid>
- Or: "No specific rules apply"
```

### Phase 5: Completion

#### 5.1 Mark Task as Ready
- Update `plan.md`: change `[~]` to `[R]` for this task
  - Change `- [~] Task description` to `- [R] Task description`
- The task is now ready for `fedy-do-task` to execute

#### 5.2 Summary
Display what was created:

> "Task plan created: tasks/<number>.<task-name>.md
> 
> Task: <task description>
> Status: [R] Ready for execution
> 
> Implementation plan includes:
> - X files to modify/create
> - X implementation steps
> - X test cases planned
> - Prerequisite tasks: <list or None>
> 
> Run `fedy-do-task` to execute this task."

## Task File Template

```markdown
# Task <N>: <Task Title>

## Status
- [R] Ready

## Summary
<Brief description of the task goal and expected outcome>

## Files to Modify/Create
- `path/to/file.ts` - Description of changes

## Implementation Steps

### Step 1: <Title>
Description of what to do.

### Step 2: <Title>
Description of what to do.

## Test Plan
- [ ] `path/to/file.test.ts` - Description

### Key Test Cases
1. Test case description

## Dependencies

### Prerequisite Tasks
None / List of tasks from plan.md that must complete first

### Package Dependencies
None required / List of packages

## Architecture Alignment
How this fits the high-level design patterns.

## Relevant Implementation Rules
- Rule title - Brief reminder of what to do/avoid
- Or: "No specific rules apply"
```

## Task Status in Task File

The task file status should match the plan.md status:
- `- [R] Ready` - When task file is created (ready for execution)
- `- [-] In progress` - When `fedy-do-task` starts executing
- `- [x] Completed` - When task is done

## Important Rules

1. **One task, one plan** - Each task file plans exactly one task from plan.md
2. **Follow the design** - Never deviate from high-level-design.md
3. **Be specific** - Include actual file paths and code patterns
4. **Plan tests** - Always include a test plan if the project has a test framework
5. **Sequential numbering** - Task numbers must be sequential (1, 2, 3...)
6. **Mark status immediately** - Change `[ ]` to `[~]` at start, `[~]` to `[R]` when done
7. **Document prerequisites** - Parse `| depends:` from plan.md and list in task file
8. **Consider implementation rules** - Reference relevant rules from `rules/implementation-rules.md` in the task file

## Error Handling

### No Pending Tasks
> "No pending tasks found. Run `fedy-plan-next` to generate new tasks."

### Empty High-Level Design
> "The high-level design is empty. Run `fedy-create-high-level-design` first to define the architecture."

### Task Already Planned
If a task file already exists for the first pending task:
> "Task already planned: tasks/<number>.<task-name>.md
> Run `fedy-do-task` to execute it, or manually remove the file to re-plan."

### Task Already Being Planned
If the first available task is marked `[~]` (Planning):
> "Task is already being planned by another agent.
> Looking for next available `[ ]` pending task..."
> (Continue to next `[ ]` task, or inform user if none available)
