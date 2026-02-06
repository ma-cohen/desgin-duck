# Fedy Create High-Level Design Command

Generate a concise, easy-to-understand high-level design document for the application.

## Prerequisites

- The Fedy project must be initialized (run `fedy-init` first)
- The `fedy/<projectName>-fedy/architecture/high-level-design.md` file should exist

## Input Gathering

### 1. Get Project Specification

Ask the user for the initial project specification:

> "Please provide the project specification or describe what you're building. Include the main goals, features, and any constraints."

### 2. Review Context Folder

Look for additional context in:
```
fedy/context/
```

Review any files in this folder to inform design decisions. This may include:
- Existing codebase documentation
- Technical constraints
- Business requirements
- Integration needs

## Output Location

Write the high-level design to:
```
fedy/<projectName>-fedy/architecture/high-level-design.md
```

## Document Structure

Create a **concise and simple** document with the following sections:

```markdown
# High-Level Design: <Project Name>

## Overview
[2-3 sentences describing what the application does]

## Design Guidelines

### Core Principles
- [Principle 1]
- [Principle 2]
- [Principle 3]

### Key Design Decisions

| Decision | Choice | Why | Tradeoff |
|----------|--------|-----|----------|
| [Area] | [What we chose] | [Reasoning] | [What we gave up] |

## Architecture Diagram

```
[ASCII or Mermaid diagram showing main components and their relationships]
```


## Design Principles

When creating the design:

1. **Keep it simple** - Avoid over-engineering. Choose the simplest solution that works.
2. **Be explicit** - Clearly state what was chosen and why.
3. **Show tradeoffs** - Every decision has a cost. Document what was sacrificed.
4. **Make it visual** - The diagram should communicate the architecture at a glance.
5. **Stay concise** - If it can't fit on one page, it's too complex.
6. **Design for testability** - read testing.md from the context.
7. Think about split into domain for better separation of concerns

## Collaboration

After generating the initial design inside architecture/high-level-design.md:

1. Present the design to the user
2. Ask: "Does this design align with your vision? What would you like to change or clarify?"
3. Iterate based on feedback until the user is satisfied
4. Confirm: "Is this high-level design finalized and ready to guide development?"

## Success Message

> "High-level design created at `architecture/high-level-design.md`


