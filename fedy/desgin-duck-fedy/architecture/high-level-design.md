# High-Level Design: Design Duck

## Overview

Design Duck is a requirements gathering and management tool that helps teams capture, organize, and visualize software requirements. It uses a file-based architecture allowing an AI agent to edit requirements in real-time while a UI renders the current state, enabling collaborative human-agent requirement refinement.

## Design Guidelines

### Core Principles

- **File-First Architecture** - All requirements stored as structured YAML files, enabling agent editing + live UI rendering
- **User Value Focus** - Main requirements always center on how the product delivers value to users
- **Requirement Traceability** - Derived requirements explicitly link back to the main requirements they support
- **Zero-Config for Consumers** - Install the package, run the CLI, everything works. No build tooling required in consuming projects.

### Key Design Decisions

| Decision | Choice | Why | Tradeoff |
|----------|--------|-----|----------|
| Storage Format | YAML files | Human-readable, supports comments, clean syntax for requirements | Needs js-yaml parser, whitespace-sensitive |
| Distribution | Bun package + pre-built UI | Self-contained CLI with built-in HTTP server and pre-built React UI | Requires Bun for building, but consumers need nothing |
| Package consumption | No npm publish required | Consumable via git or local path; `npm install github:user/repo` or `npm install file:../path` | No central registry; users need repo access or local clone |
| Runtime | Bun | Zero dependencies, built-in TypeScript, fast bundler | Newer runtime, less ecosystem |
| Requirement Types | Main + Derived hierarchy | Clear separation between user value vs technical enablers | Requires discipline to categorize correctly |
| State Management | Zustand | Simple, SSE-friendly, works outside React for agent updates | Less structured than Redux |
| Real-time Updates | File watcher + SSE | Server-side file watcher pushes events via SSE to browser; instant updates, no polling waste | Requires SSE-capable browser (all modern browsers) |
| UI Serving | Built-in HTTP server | Self-contained, no Vite/webpack needed at runtime; pre-built UI shipped with package | UI must be rebuilt when changing components |
| UI Framework | React + Tailwind | Fast iteration, modern tooling | Build-time only dependency |

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                          DESIGN DUCK                                  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐         ┌──────────────────────────────────────┐   │
│  │   AI Agent   │         │           File System                 │   │
│  │  (Cursor)    │────────▶│                                      │   │
│  │              │  writes │  requirements/                        │   │
│  └──────────────┘         │  ├── project.yaml     (metadata)     │   │
│                           │  ├── main.yaml        (user value)   │   │
│                           │  └── derived.yaml     (technical)    │   │
│                           └──────────┬───────────────────────────┘   │
│                                      │                               │
│                              watches │ (fs.watch)                    │
│                                      ▼                               │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │              Built-in HTTP Server (ui-server.ts)               │   │
│  │                                                               │   │
│  │  GET /                → Pre-built UI (dist-ui/index.html)     │   │
│  │  GET /assets/*        → Pre-built JS/CSS (dist-ui/assets/)    │   │
│  │  GET /requirements/*  → YAML files from consumer's project    │   │
│  │  GET /events          → SSE stream (file change events)       │   │
│  └───────────────────────────────┬───────────────────────────────┘   │
│                                  │                                   │
│                         serves   │  SSE events                       │
│                                  ▼                                   │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐   │
│  │   React UI   │    │              Zustand Store                │   │
│  │  (browser)   │◀──▶│  - mainRequirements[]                    │   │
│  │              │    │  - derivedRequirements[]                  │   │
│  │  - Tree View │    │  - loadFromFiles()  → fetch YAML via HTTP│   │
│  │  - Cards     │    │  - startWatching()  → SSE + poll fallback│   │
│  └──────────────┘    │  - stopWatching()                        │   │
│                      └──────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
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
│       └── requirement.test.ts
│
├── infrastructure/              # File system & server operations
│   ├── yaml-parser.ts          # Pure YAML parsing (browser-safe, no Node imports)
│   ├── file-store.ts           # Filesystem readers (Node/Bun only, re-exports parsers)
│   ├── file-watcher.ts         # Watch for external YAML changes (fs.watch)
│   ├── ui-server.ts            # Built-in HTTP server (static files + YAML + SSE)
│   └── vite-requirements-plugin.ts  # Vite plugin (dev mode only)
│
├── stores/                      # Zustand stores (browser)
│   └── requirements-store.ts   # State + loadFromFiles() + SSE watching
│
├── commands/                    # CLI command handlers
│   ├── init.ts                 # Scaffold requirements/
│   ├── ui.ts                   # Start built-in UI server
│   └── validate.ts             # Validate YAML files
│
├── ui/                          # React entry points
│   ├── main.tsx                # React root
│   ├── App.tsx                 # App shell + watcher lifecycle
│   └── index.css               # Tailwind styles
│
└── components/                  # React UI components
    ├── RequirementList.tsx
    ├── RequirementCard.tsx
    └── RequirementTree.tsx      # Shows main → derived relationships
```

## Key Flows

### Agent Creates/Updates Requirement
```
1. Agent edits main.yaml or derived.yaml (adds/modifies requirement)
2. File watcher (fs.watch) detects YAML change
3. Server sends SSE event "requirements-changed" to all connected browsers
4. Zustand store receives SSE event, calls loadFromFiles()
5. Store fetches updated YAML via HTTP from the server
6. UI re-renders with updated requirements
```

### User Views Requirements
```
1. User runs `npx design-duck ui` from their project
2. Built-in HTTP server starts on localhost:3456
3. Server serves pre-built React UI from dist-ui/
4. Server serves requirements/ YAML files from the project's working directory
5. Server starts file watcher on requirements/ directory
6. Browser connects to SSE endpoint for live updates
```

## Build Pipeline

Design Duck has a two-stage build:

| Stage | Command | Input | Output | Purpose |
|-------|---------|-------|--------|---------|
| CLI | `bun build src/cli.ts --outdir=dist --target=bun` | `src/cli.ts` + all server code | `dist/cli.js` | Bundled CLI with built-in HTTP server |
| UI | `vite build` | `src/ui/`, `src/components/`, `src/stores/` | `dist-ui/` | Pre-built React app (static HTML/JS/CSS) |

Both are run via `bun run build`. The `dist/` and `dist-ui/` directories are shipped with the package (`files` field in package.json).

## Installation & Usage

The CLI is designed to be **runnable without publishing to npm**. Consumers can install from git or a local path.

```bash
# From Git (public or private repo)
npm install github:ma-cohen/desgin-duck#main

# From local path (e.g. while developing)
npm install file:../path/to/desgin-duck

# Then run the CLI
npx design-duck init       # Scaffold requirements/
npx design-duck validate   # Validate YAML files
npx design-duck ui         # Start UI server with live reload
```

### Development (inside the design-duck repo)

```bash
# Run from source
bun run src/cli.ts init
bun run src/cli.ts validate

# Dev mode UI (with Vite HMR)
bun run dev:ui

# Build for distribution
bun run build

# Run tests
bun test
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `init` | Creates `requirements/` folder with project.yaml, main.yaml, derived.yaml. Runs `git init` if not already a repo. |
| `ui` | Starts built-in HTTP server on port 3456, opens browser, watches for YAML file changes with live reload via SSE |
| `validate` | Validates all requirement files against schema, reports errors to stdout |

## Out of Scope (Phase 1)

- Requirement versioning/history
- Multi-user collaboration
- Export to other formats (Word, PDF)
- Integration with project management tools
