# Fedy Add Rule Command

Add an implementation rule to prevent repeating mistakes.

**Use this when:** Fedy made a mistake you don't want repeated, or you want to capture a project-specific guideline.

## Prerequisites

Before running this command, ensure:
1. A Fedy project exists (run `fedy-init` first if not)

## Execution Steps

### 1. Create Rules Folder

If it doesn't exist, create:
```
fedy/<projectName>-fedy/rules/
```

### 2. Gather Rule Information

Ask the user for the following information:

#### 2.1 Rule Title
> "What should this rule be called? (e.g., 'Use Tailwind for styling', 'Always add error handling')"

#### 2.2 Context
> "When does this rule apply? (e.g., 'When creating React components', 'When writing API handlers')"

#### 2.3 What to Avoid (Don't)
> "What should be avoided? (The mistake that was made)"

#### 2.4 What to Do Instead (Do)
> "What should be done instead? (The correct approach)"

#### 2.5 Example (Optional)
> "Would you like to add a code example? (Optional - press Enter to skip)"

If the user provides an example, capture it.

### 3. Create or Update Rules File

#### 3.1 Check for Existing File
- Check if `rules/implementation-rules.md` exists
- If it exists, append the new rule
- If it doesn't exist, create it with the header

#### 3.2 File Header (only for new files)

If creating a new file, start with:
```markdown
# Implementation Rules

Rules and guidelines for this project. Fedy reads these before executing tasks.

```

#### 3.3 Append the Rule

Add the new rule to the file:

```markdown
---

## Rule: [Title from user]

**Context:** [Context from user]

**Don't:** [What to avoid from user]

**Do:** [What to do instead from user]

**Example:** [If provided]
[Code example if provided]

```

### 4. Confirm Rule Added

Display confirmation:

> "Rule added to rules/implementation-rules.md!
> 
> ## Rule: [Title]
> 
> **Context:** [Context]
> **Don't:** [Don't]
> **Do:** [Do]
> 
> This rule will be applied during future task execution."

## Rule Format Reference

Each rule follows this structure:

```markdown
---

## Rule: [Short descriptive title]

**Context:** When does this rule apply?

**Don't:** What to avoid (the mistake)

**Do:** What to do instead (the correct approach)

**Example:** (optional)
Code example showing the correct pattern

```

## Example Interaction

```
User: fedy-add-rule

Fedy: What should this rule be called?
User: Use Tailwind CSS for styling

Fedy: When does this rule apply?
User: When styling React components

Fedy: What should be avoided? (The mistake)
User: Using inline style={{}} props for styling

Fedy: What should be done instead?
User: Always use Tailwind CSS classes via className

Fedy: Would you like to add a code example? (Optional)
User: Yes
- Bad: <div style={{color: 'red'}}>
- Good: <div className="text-red-500">

Fedy: Rule added to rules/implementation-rules.md!

## Rule: Use Tailwind CSS for styling

**Context:** When styling React components
**Don't:** Using inline style={{}} props for styling
**Do:** Always use Tailwind CSS classes via className

This rule will be applied during future task execution.
```

## Final Structure

After adding rules:

```
fedy/<projectName>-fedy/
├── plan.md
├── rules/
│   └── implementation-rules.md
├── tasks/
├── hooks/
└── architecture/
```

## Updating Rules

To modify existing rules:
- Edit `rules/implementation-rules.md` directly
- Run `fedy-add-rule` again to add more rules

## Deleting Rules

To remove a rule:
- Edit `rules/implementation-rules.md` and delete the rule section
- Keep the `---` separators intact between remaining rules

## Error Handling

### No Fedy Project
> "No Fedy project found. Run `fedy-init` first to create a project."

### User Cancels
If user provides empty input for required fields:
> "Rule creation cancelled. No changes made."
