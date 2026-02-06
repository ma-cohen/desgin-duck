# Plan

<!-- Task status: [ ] Pending, [~] Planning, [R] Ready, [-] In Progress, [x] Completed -->
<!-- Use | e2e: <feature> to show product value, | depends: <task> for dependencies -->

- [x] Scaffold Bun package with TypeScript, CLI entry (init/ui/validate stubs), and package.json bin | e2e: Run Design Duck CLI
- [x] Implement init command to create requirements/ with project.yaml, main.yaml, derived.yaml | e2e: Project bootstrap | depends: Scaffold Bun package
- [x] Run git init in init command when directory is not already a git repo | e2e: Project bootstrap | depends: Implement init command to create requirements/
- [x] Add requirement domain types and validation (main + derived) in src/domain/requirements/ | e2e: Requirements data model
- [ ] Implement YAML file reader in src/infrastructure/file-store.ts to parse main.yaml and derived.yaml into domain types | e2e: Validate Requirements CLI
- [ ] Implement validate command to read requirement files and validate all requirements, reporting errors to stdout | e2e: Validate Requirements CLI | depends: Implement YAML file reader
- [ ] Add unit tests for file-store YAML parsing with valid, malformed, and missing file cases | e2e: Validate Requirements CLI | depends: Implement YAML file reader
