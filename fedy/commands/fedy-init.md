# Fedy Init Command

Initialize a new Fedy project workspace.

## Prerequisites

Before running this command, ensure a `fedy` folder exists in the root of your project. If it doesn't exist, inform the user:

> "No `fedy` folder found in the project root"

## Execution Steps

### 1. Determine Project Name

- Extract the project name from the workspace root folder name
- If unable to determine, ask the user: "What would you like to name this Fedy project?"

### 2. Create Project Folder Structure

Create a new folder inside `fedy/` with the naming convention:
```
fedy/<projectName>-fedy/
```

### 3. Create Tasks Folder

Inside the new project folder, create:
```
fedy/<projectName>-fedy/tasks/
```

With an initial task file `0.task.md` containing:
```markdown
# Task 0

Hello from Fedy! 👋

Your Fedy workspace is ready. Create new task files in this folder to start working with the Fedy agent.
```

### 4. Create Plan File

In the root of the project folder, create:
```
fedy/<projectName>-fedy/plan.md
```

With initial content:
```markdown
# Plan

<!-- Add one task per line, more detailed info is in tasks.md -->

- [ ] 
```

### 5. Create Architecture Folder

Inside the new project folder, create:
```
fedy/<projectName>-fedy/architecture/
```

With an empty file:
```
fedy/<projectName>-fedy/architecture/high-level-design.md
```

### 6. Create Rules Folder

Inside the new project folder, create:
```
fedy/<projectName>-fedy/rules/
```

With an initial file `implementation-rules.md` containing:
```markdown
# Implementation Rules

Rules and guidelines for this project. Fedy reads these before executing tasks.

<!-- Add rules using `fedy-add-rule` or manually following the format below -->

<!--
---

## Rule: [Rule Title]

**Context:** When does this rule apply?

**Don't:** What to avoid

**Do:** What to do instead

**Example:** (optional)
Code example

-->
```

## Final Structure

After running `fedy init`, the folder structure should look like:

```
<project-root>/
└── fedy/
    └── <projectName>-fedy/
        ├── plan.md
        ├── tasks/
        │   └── 0.task.md
        ├── architecture/
        │   └── high-level-design.md
        └── rules/
            └── implementation-rules.md
```

## Success Message

After successful initialization, display:

> "Fedy project '<projectName>-fedy' initialized successfully!
> 
> Created:
> - plan.md - Your task checklist (one task per line)
> - tasks/0.task.md - Your first task file
> - architecture/high-level-design.md - Document your system architecture here
> - rules/implementation-rules.md - Add implementation rules with `fedy-add-rule`
> 
> You're ready to start working with Fedy!"
