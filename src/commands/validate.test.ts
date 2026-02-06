import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validate } from "./validate";

describe("validate", () => {
  let testDir: string;
  let reqDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    reqDir = join(testDir, "desgin-duck", "requirements");
    mkdirSync(reqDir, { recursive: true });
    process.exitCode = 0;
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    process.exitCode = 0;
  });

  test("exits with code 1 when desgin-duck/requirements/ directory does not exist", () => {
    rmSync(reqDir, { recursive: true });
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("validates empty main.yaml and derived.yaml successfully", () => {
    writeFileSync(join(reqDir, "main.yaml"), "requirements: []", "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), "requirements: []", "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("validates valid main.yaml with requirements", () => {
    const mainYaml = `requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
    priority: high
    status: draft
`;
    writeFileSync(join(reqDir, "main.yaml"), mainYaml, "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), "requirements: []", "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("validates valid derived.yaml with requirements", () => {
    const derivedYaml = `requirements:
  - id: der-001
    description: Use Elasticsearch for search
    derivedFrom:
      - req-001
    rationale: Enables fast search
    category: technical
    priority: high
    status: draft
`;
    writeFileSync(join(reqDir, "main.yaml"), "requirements: []", "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), derivedYaml, "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("exits with code 1 when main.yaml is missing", () => {
    writeFileSync(join(reqDir, "derived.yaml"), "requirements: []", "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when derived.yaml is missing", () => {
    writeFileSync(join(reqDir, "main.yaml"), "requirements: []", "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when main.yaml has malformed YAML", () => {
    writeFileSync(join(reqDir, "main.yaml"), "requirements: [invalid yaml", "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), "requirements: []", "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when main.yaml has invalid requirement", () => {
    const mainYaml = `requirements:
  - id: req-001
    description: Missing userValue field
    priority: high
    status: draft
`;
    writeFileSync(join(reqDir, "main.yaml"), mainYaml, "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), "requirements: []", "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when derived.yaml has invalid requirement", () => {
    const derivedYaml = `requirements:
  - id: der-001
    description: Missing derivedFrom field
    rationale: Some rationale
    category: technical
    priority: high
    status: draft
`;
    writeFileSync(join(reqDir, "main.yaml"), "requirements: []", "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), derivedYaml, "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when main.yaml has invalid priority", () => {
    const mainYaml = `requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
    priority: invalid
    status: draft
`;
    writeFileSync(join(reqDir, "main.yaml"), mainYaml, "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), "requirements: []", "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when derived.yaml has invalid category", () => {
    const derivedYaml = `requirements:
  - id: der-001
    description: Use Elasticsearch for search
    derivedFrom:
      - req-001
    rationale: Enables fast search
    category: invalid
    priority: high
    status: draft
`;
    writeFileSync(join(reqDir, "main.yaml"), "requirements: []", "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), derivedYaml, "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("validates multiple requirements in both files", () => {
    const mainYaml = `requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
    priority: high
    status: draft
  - id: req-002
    description: Users can save items to wishlist
    userValue: Increases conversion
    priority: medium
    status: review
`;
    const derivedYaml = `requirements:
  - id: der-001
    description: Use Elasticsearch for search
    derivedFrom:
      - req-001
    rationale: Enables fast search
    category: technical
    priority: high
    status: draft
  - id: der-002
    description: Use React with TypeScript
    derivedFrom:
      - req-001
      - req-002
    rationale: Large hiring pool
    category: operational
    priority: high
    status: approved
`;
    writeFileSync(join(reqDir, "main.yaml"), mainYaml, "utf-8");
    writeFileSync(join(reqDir, "derived.yaml"), derivedYaml, "utf-8");
    
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });
});
