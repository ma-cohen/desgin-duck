# Fedy Change High-Level Design Command

Modify the existing high-level design based on user requirements, documenting what changed and why.

## Prerequisites

Before running this command, ensure:
1. A Fedy project exists (run `fedy-init` first if not)
2. The `architecture/high-level-design.md` file exists and has content
3. If no design exists, suggest: "Run `fedy-create-high-level-design` first to create the initial design."

## Execution Steps

### Phase 1: Understand Current State

#### 1.1 Read Current Design
- Open `architecture/high-level-design.md`
- Understand the existing:
  - Overview and goals
  - Design guidelines and principles
  - Key design decisions and tradeoffs
  - Architecture diagram
  - Folder structure

#### 1.2 Get Change Request
Ask the user:

> "What would you like to change in the high-level design? Please describe:
> 1. What you want to change
> 2. Why this change is needed"

### Phase 2: Analyze the Change

#### 2.1 Assess Impact
Determine:
- Which sections of the design are affected
- What existing decisions need to be revised
- Are there new tradeoffs to consider
- Does this conflict with existing principles

#### 2.2 Validate with User
If the change has significant implications, confirm:

> "This change will affect:
> - [List of impacted areas]
> 
> Do you want to proceed?"

### Phase 3: Document the Change

#### 3.1 Add to Changelog Section
Add or update a `## Changelog` section at the end of the high-level design:

```markdown
## Changelog

### Change <N>: <Brief Title>
**Date:** <YYYY-MM-DD>

**What Changed:**
- <Concise description of what was modified>

**Why:**
- <Clear reasoning for the change>

**Impact:**
- <What parts of the system are affected>
```

### Phase 4: Update the Design

#### 4.1 Modify Affected Sections
Update the relevant sections of `high-level-design.md`:

- **Overview** - If the change affects the app's purpose
- **Design Guidelines** - If principles or patterns change
- **Key Design Decisions** - Add/modify the decisions table
- **Architecture Diagram** - Update if structure changes
- **Folder Structure** - Update if file organization changes

#### 4.2 Keep It Consistent
Ensure:
- The updated design remains concise and clear
- New decisions follow the same format as existing ones
- The diagram reflects any architectural changes
- No contradictions between sections

### Phase 5: Present the Changes

#### 5.1 Show Before/After
Present a clear summary:

> "## Design Change Summary
> 
> ### What Changed
> <Clear description of the modification>
> 
> ### Why
> <Reasoning behind the change>
> 
> ### Sections Updated
> - [Section 1]: <what was updated>
> - [Section 2]: <what was updated>
> 
> ### New Design Decision
> | Decision | Choice | Why | Tradeoff |
> |----------|--------|-----|----------|
> | [Area] | [New choice] | [Reasoning] | [What we gave up] |"

#### 5.2 Get Confirmation
Ask the user:

> "Does this change accurately reflect what you wanted? Would you like to adjust anything?"

Iterate until the user is satisfied.

## Changelog Entry Template

```markdown
### Change <N>: <Title>
**Date:** <YYYY-MM-DD>

**What Changed:**
- <Description>

**Why:**
- <Reasoning>

**Impact:**
- <Affected areas>

**Previous:**
- <What it was before, if relevant>

**New:**
- <What it is now>
```

## Important Rules

1. **Preserve history** - Never delete the changelog, always append
2. **Be explicit** - Clearly state what changed and why
3. **Stay concise** - Keep explanations brief but complete
4. **Update everything** - Ensure all related sections are updated
5. **No contradictions** - The final design must be internally consistent
6. **Ask if unclear** - If the change request is ambiguous, ask for clarification

## Error Handling

### No Existing Design
> "No high-level design found. Run `fedy-create-high-level-design` first to create the initial design."

### Conflicting Change
If the requested change conflicts with existing decisions:
> "This change conflicts with the existing decision:
> - [Existing decision]
> 
> Options:
> 1. Override the existing decision (update both)
> 2. Modify your request to work within existing constraints
> 
> Which would you prefer?"

### Unclear Request
> "I need more details to make this change. Could you clarify:
> - [Specific question]"

## Success Message

> "High-level design updated!
> 
> Changes documented in `architecture/high-level-design.md`
> - Changelog entry added
> - [X] sections updated
> 
> Run `fedy-plan-task` to plan tasks that align with the new design."
