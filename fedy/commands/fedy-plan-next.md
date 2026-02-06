# Fedy Plan Next Command

Generate the next 2-3 actionable tasks for the project plan.

## Prerequisites

Before running this command, ensure:
1. A Fedy project exists (run `fedy-init` first if not)
2. The `plan.md` file exists in the project root
3. The `architecture/high-level-design.md` file exists

## Task Status Reference

Tasks in `plan.md` use these status markers:
- `[ ]` **Pending** - Task idea, no task file yet
- `[~]` **Planning** - `fedy-plan-task` is creating the task file
- `[R]` **Ready** - Task file complete, ready for execution
- `[-]` **In Progress** - Being executed by an agent
- `[x]` **Completed** - Done

## Execution Steps

### 1. Gather Context

Read the following files to understand the current state:

1. **plan.md** - Review existing tasks and their status
2. **architecture/high-level-design.md** - Understand the system architecture and goals
3. **Codebase** - Scan relevant source files to understand what's already implemented

### 2. Analyze Current State

Determine:
- What tasks are completed (marked with `[x]`)
- What tasks are in progress (marked with `[-]`)
- What tasks are ready or being planned (marked with `[R]` or `[~]`)
- What tasks are pending (marked with `[ ]`)
- What's the next logical step based on the high-level design
- What dependencies exist between components

### 3. Generate Next Tasks

Create **2-3 new tasks** following these rules:

#### Task Requirements

Each task MUST be:
- **One-liner**: A single, clear sentence
- **Atomic**: Does exactly ONE thing
- **Commit-sized**: Results in a single, understandable commit
- **Verifiable**: Has a clear "done" state

#### Task Format

```markdown
- [ ] <verb> <what> <where/context> | e2e: <feature/goal this contributes to>
- [ ] <verb> <what> | e2e: <feature> | depends: <dependency task name>
```

The `| e2e:` annotation is **required** for every task. It explains what end-to-end feature or user-facing goal the task contributes to, helping users understand the product value of each step.

#### E2E Feature Analysis

Before generating tasks, identify the E2E feature or goal being worked on:
- Review the high-level design to understand what user-facing features are next
- Determine which E2E feature the new tasks will contribute to
- All tasks in a batch should ideally contribute to the same E2E feature (or related features)
- The `e2e:` annotation should describe the product value (e.g., "User Authentication Flow", "Product Search", "Checkout Process")

#### Dependency Analysis

When generating tasks, analyze which tasks depend on others:
- If Task B requires code/files from Task A, add `| depends: Task A`
- Tasks WITHOUT dependencies can run in parallel
- Tasks WITH dependencies must wait for their dependencies to complete

#### Good Examples

```markdown
- [ ] Create User model with email and password fields | e2e: User Authentication Flow
- [ ] Add login endpoint to auth controller | e2e: User Authentication Flow | depends: Create User model
- [ ] Write unit tests for password validation | e2e: User Authentication Flow | depends: Create User model
```

Tasks 2 and 3 both depend on Task 1, but can run in parallel with each other. All three tasks contribute to the same E2E feature: "User Authentication Flow".

#### Bad Examples (Too Big)

```markdown
- [ ] Implement user authentication system  <!-- Too broad, multiple commits -->
- [ ] Build the frontend                     <!-- Way too vague -->
- [ ] Add all API endpoints                  <!-- Multiple features -->
```

### 4. Update plan.md

Append the new tasks to the existing `plan.md` file, maintaining the checklist format:

```markdown
# Plan

<!-- Task status: [ ] Pending, [~] Planning, [R] Ready, [-] In Progress, [x] Completed -->
<!-- Use | e2e: <feature> to show product value, | depends: <task> for dependencies -->

- [x] Completed task 1 | e2e: Feature A
- [-] In progress task | e2e: Feature A
- [R] Ready task (has task file) | e2e: Feature A
- [~] Being planned task | e2e: Feature B
- [ ] Existing pending task | e2e: Feature B
- [ ] New task 1 | e2e: Feature B
- [ ] New task 2 | e2e: Feature B | depends: New task 1
```

## Output

After updating the plan, display:

> "Added X new tasks to plan.md:
> 
> E2E Feature: <feature name>
> - [ ] Task 1 description | e2e: <feature name>
> - [ ] Task 2 description | e2e: <feature name> | depends: Task 1
>
> Dependency analysis:
> - Task 1: No dependencies (can start immediately)
> - Task 2: Depends on Task 1 (must wait)
>
> Product value: When these tasks are completed, <explain what user-facing functionality will be delivered>.
>
> Run `fedy-plan-task` to create a detailed plan for a pending task."


## Notes

- Only add tasks that make sense given the current project state
- Prioritize foundational work before features that depend on it
- Consider the natural order: models → services → controllers → UI
- **Always include `| e2e:`** - Every task must state which E2E feature it contributes to
- **Analyze dependencies** between tasks and mark them with `| depends:`
- Tasks without dependencies can potentially run in parallel
- If the high-level design is empty, suggest running `fedy-create-high-level-design` first
