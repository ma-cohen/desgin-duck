# High-Level Design: Design Duck

## Overview

Design Duck is a requirements gathering and management tool that helps teams capture, organize, and visualize software requirements. It uses a file-based architecture allowing an AI agent to edit requirements in real-time while a UI renders the current state, enabling collaborative human-agent requirement refinement.

## Design Guidelines

### Core Principles

- **File-First Architecture** - All requirements stored as structured files (JSON/Markdown), enabling agent editing + live UI rendering
- **User Value Focus** - Main requirements always center on how the product delivers value to users
- **Requirement Traceability** - Derived requirements explicitly link back to the main requirements they support

### Key Design Decisions

| Decision | Choice | Why | Tradeoff |
|----------|--------|-----|----------|
| Storage Format | YAML files | Human-readable, supports comments, clean syntax for requirements | Needs js-yaml parser, whitespace-sensitive |
| Distribution | Bun package + UI | `bun run src/cli.ts init` to scaffold, `bun run src/cli.ts ui` to view | Requires Bun installed |
| Package consumption | No npm publish required | Consumable via git or local path; `npm install github:user/repo` or `npm install file:../path` | No central registry; users need repo access or local clone |
| Runtime | Bun | Zero dependencies, built-in TypeScript, fast bundler | Newer runtime, less ecosystem |
| Requirement Types | Main + Derived hierarchy | Clear separation between user value vs technical enablers | Requires discipline to categorize correctly |
| State Management | Zustand | Simple, file-watching friendly, works outside React for agent updates | Less structured than Redux |
| Real-time Updates | File watcher + polling | Decoupled agent/UI, no socket complexity | Slight latency vs WebSocket |
| UI Framework | React + Tailwind | Fast iteration, modern tooling | - |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DESIGN DUCK                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────────────────────────────┐  │
│  │   AI Agent   │         │           File System                 │  │
│  │  (Cursor)    │────────▶│                                      │  │
│  │              │  writes │  requirements/                        │  │
│  └──────────────┘         │  ├── project.yaml     (metadata)     │  │
│                           │  ├── main.yaml        (user value)   │  │
│  ┌──────────────┐         │  └── derived.yaml     (technical)    │  │
│  │   React UI   │◀────────│                                      │  │
│  │              │  reads  │                                      │  │
│  │  - List View │         │                                      │  │
│  │  - Tree View │         │                                      │  │
│  │  - Editor    │         └──────────────────────────────────────┘  │
│  └──────────────┘                                                    │
│         │                                                            │
│         │ uses                                                       │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Zustand Store                            │   │
│  │  - requirements[]     - loadFromFiles()                       │   │
│  │  - selectedId         - syncToFile()                          │   │
│  │  - filter             - watchFiles()                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Model

### Requirement File Structure

```
requirements/
├── project.yaml                 # Project metadata
├── main.yaml                    # All user-value requirements
├── main-2.yaml                  # (optional) Pagination for large projects
└── derived.yaml                 # All technical/enabling requirements
```

### Main Requirements File (main.yaml)

```yaml
# main.yaml - User-value requirements
requirements:
  - id: req-001
    description: Users need to quickly find products by searching with partial names
    userValue: Reduces time to find desired product from minutes to seconds
    priority: high
    status: draft

  - id: req-002
    description: Users can save items to a wishlist for later purchase
    userValue: Increases conversion by letting users return to considered items
    priority: medium
    status: draft
```

### Derived Requirements File (derived.yaml)

```yaml
# derived.yaml - Technical/enabling requirements
requirements:
  - id: der-001
    description: Use Elasticsearch for search backend to meet performance needs
    derivedFrom:
      - req-001
    rationale: Enables sub-200ms search, team has experience, hiring pool available
    category: technical  # technical | operational | quality | constraint
    priority: high
    status: draft

  - id: der-002
    description: Use React with TypeScript for frontend development
    derivedFrom:
      - req-001
      - req-002
    rationale: Large hiring pool, team expertise, type safety reduces bugs
    category: operational
    priority: high
    status: draft
```

### Derived Requirement Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `technical` | Technology/framework choices | React, TypeScript, specific DB |
| `operational` | Team/hiring/process needs | Framework for hiring, documentation |
| `quality` | Stability/performance enablers | Testing strategy, monitoring |
| `constraint` | External limitations | Compliance, budget, timeline |

## Domain Structure

```
src/
├── domain/                      # Pure business logic (no React)
│   └── requirements/
│       ├── requirement.ts       # Types & validation
│       ├── requirement.test.ts
│       ├── operations.ts        # CRUD operations
│       └── operations.test.ts
│
├── infrastructure/              # File system operations
│   ├── file-store.ts           # Read/write JSON files
│   └── file-watcher.ts         # Watch for external changes
│
├── stores/                      # Zustand stores
│   └── useRequirementsStore.ts
│
└── components/                  # React UI
    ├── RequirementList.tsx
    ├── RequirementCard.tsx
    ├── RequirementEditor.tsx
    └── RequirementTree.tsx      # Shows main → derived relationships
```

## Key Flows

### Agent Creates/Updates Requirement
```
1. Agent edits main.yaml or derived.yaml (adds/modifies requirement)
2. File watcher detects change
3. Store reloads from filesystem
4. UI re-renders with updated requirements
```

### User Edits via UI
```
1. User modifies requirement in editor
2. Store updates state
3. Store syncs to YAML file (debounced)
4. Agent can read updated file
```

## Installation & Usage

The CLI is designed to be **runnable without publishing to npm**. Consumers can install from git or a local path.

```bash
# Development (run directly with Bun)
bun run src/cli.ts init
bun run src/cli.ts ui

# Build for distribution
bun run build

# Run built version with Node
node dist/cli.js init
node dist/cli.js ui
```

### Consuming from another project (no npm publish)

```bash
# From Git (public or private repo)
npm install github:owner/desgin-duck#main

# From local path (e.g. while developing)
npm install file:../path/to/desgin-duck

# Then run the CLI
npx design-duck init
npx design-duck ui
```

Ensure `package.json` exposes a `bin` entry so the CLI is available after install.

### CLI Commands

| Command | Description |
|---------|-------------|
| `init` | Creates `requirements/` folder with project.yaml, main.yaml, derived.yaml |
| `ui` | Starts local server, opens UI in browser, watches for file changes |
| `validate` | Validates all requirement files against schema |

## Out of Scope (Phase 1)

- Requirement versioning/history
- Multi-user collaboration
- Export to other formats (Word, PDF)
- Integration with project management tools
