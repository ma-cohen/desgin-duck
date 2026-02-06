# Design Duck

Requirements gathering and management tool for human-agent collaboration.

Design Duck uses a file-based architecture: an AI agent edits YAML requirement files while a live UI renders the current state. When the agent (or anyone) modifies a requirement file, the UI updates instantly.

## Quick Start

### 1. Install

```bash
# From GitHub
npm install github:ma-cohen/desgin-duck#main

# Or from a local clone
npm install file:../path/to/desgin-duck
```

### 2. Initialize

```bash
npx design-duck init
```

This creates a `requirements/` directory with:
- `project.yaml` -- project metadata
- `main.yaml` -- user-value requirements
- `derived.yaml` -- technical/enabling requirements

It also runs `git init` if the directory isn't already a git repo.

### 3. Add Requirements

Edit `requirements/main.yaml`:

```yaml
requirements:
  - id: req-001
    description: Users can search products by name
    userValue: Quickly find desired products
    priority: high       # high | medium | low
    status: draft        # draft | review | approved
```

Edit `requirements/derived.yaml`:

```yaml
requirements:
  - id: der-001
    description: Use Elasticsearch for search backend
    derivedFrom:
      - req-001
    rationale: Enables sub-200ms search performance
    category: technical  # technical | operational | quality | constraint
    priority: high
    status: draft
```

### 4. Validate

```bash
npx design-duck validate
```

Checks all requirement files against the schema and reports errors.

### 5. View in UI

```bash
npx design-duck ui
```

Opens a browser at `http://localhost:3456` showing your requirements in a traceability tree (main requirements with their derived requirements nested underneath).

**Live reload**: edit any YAML file and the UI updates automatically -- no refresh needed. This works via a file watcher and Server-Sent Events.

## CLI Commands

| Command    | Description |
|------------|-------------|
| `init`     | Scaffold `requirements/` directory with starter files |
| `validate` | Validate all requirement files against the schema |
| `ui`       | Start the UI server with live reload on port 3456 |

## How It Works

```
You / AI Agent                    Design Duck
─────────────                    ───────────
                                 
Edit main.yaml  ──────────────▶  File watcher detects change
                                       │
                                       ▼
                                 Server sends SSE event
                                       │
                                       ▼
                                 Browser reloads YAML
                                       │
                                       ▼
                                 UI re-renders
```

The `ui` command starts a self-contained HTTP server that:
- Serves the pre-built React UI (no build tools needed in your project)
- Serves your `requirements/*.yaml` files
- Watches for file changes and pushes live updates to the browser via SSE

## Requirement Types

### Main Requirements (`main.yaml`)

Capture what value the product delivers to users.

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g. `req-001`) |
| `description` | Yes | What the user needs |
| `userValue` | Yes | Why this matters to the user |
| `priority` | Yes | `high`, `medium`, or `low` |
| `status` | Yes | `draft`, `review`, or `approved` |

### Derived Requirements (`derived.yaml`)

Technical or enabling requirements that support main requirements.

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g. `der-001`) |
| `description` | Yes | What needs to be done |
| `derivedFrom` | Yes | Array of main requirement IDs this supports |
| `rationale` | Yes | Why this approach was chosen |
| `category` | Yes | `technical`, `operational`, `quality`, or `constraint` |
| `priority` | Yes | `high`, `medium`, or `low` |
| `status` | Yes | `draft`, `review`, or `approved` |

## Development

### Prerequisites

- [Bun](https://bun.sh) (for building and running from source)

### Commands

```bash
bun install            # Install dependencies
bun test               # Run tests
bun run build          # Build CLI + UI for distribution
bun run dev:ui         # Dev mode with Vite HMR (for working on the UI)
bun run src/cli.ts ui  # Run CLI from source
```

### Project Structure

```
src/
├── commands/           # CLI command handlers (init, ui, validate)
├── domain/             # Requirement types and validation
├── infrastructure/     # File I/O, YAML parsing, file watcher, HTTP server
├── stores/             # Zustand state management
├── components/         # React UI components
└── ui/                 # React entry point
```

## License

MIT
