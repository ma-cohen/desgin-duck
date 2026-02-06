# Plan

<!-- Task status: [ ] Pending, [~] Planning, [R] Ready, [-] In Progress, [x] Completed -->
<!-- Use | e2e: <feature> to show product value, | depends: <task> for dependencies -->

- [x] Scaffold Bun package with TypeScript, CLI entry (init/ui/validate stubs), and package.json bin | e2e: Run Design Duck CLI
- [x] Implement init command to create requirements/ with project.yaml, main.yaml, derived.yaml | e2e: Project bootstrap | depends: Scaffold Bun package
- [x] Run git init in init command when directory is not already a git repo | e2e: Project bootstrap | depends: Implement init command to create requirements/
- [x] Add requirement domain types and validation (main + derived) in src/domain/requirements/ | e2e: Requirements data model
- [x] Implement YAML file reader in src/infrastructure/file-store.ts to parse main.yaml and derived.yaml into domain types | e2e: Validate Requirements CLI
- [x] Implement validate command to read requirement files and validate all requirements, reporting errors to stdout | e2e: Validate Requirements CLI | depends: Implement YAML file reader
- [x] Add unit tests for file-store YAML parsing with valid, malformed, and missing file cases | e2e: Validate Requirements CLI | depends: Implement YAML file reader
- [x] Install React, Vite, Tailwind CSS, and Zustand; scaffold UI app entry point (index.html, src/ui/main.tsx, src/ui/App.tsx) | e2e: View Requirements UI
- [x] Create Zustand requirements store with loadFromFiles() that uses existing file-store reader to load main and derived requirements | e2e: View Requirements UI | depends: Install React, Vite, Tailwind CSS, and Zustand
- [x] Build RequirementList and RequirementCard components to render main requirements with priority and status badges | e2e: View Requirements UI | depends: Create Zustand requirements store
- [x] Implement file watcher in src/infrastructure/file-watcher.ts to watch requirements/ for YAML changes and invoke a callback | e2e: Real-time Agent Collaboration
- [ ] Build RequirementTree component to render main requirements with nested derived requirements showing traceability | e2e: View Requirements UI | depends: Build RequirementList and RequirementCard components
- [ ] Integrate file watcher into Zustand store to auto-reload requirements when YAML files change on disk | e2e: Real-time Agent Collaboration | depends: Implement file watcher, Create Zustand requirements store
