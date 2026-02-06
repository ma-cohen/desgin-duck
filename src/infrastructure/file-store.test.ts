import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readMainRequirements, readDerivedRequirements } from "./file-store";

describe("readMainRequirements", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("parses valid main.yaml with single requirement", () => {
    const yaml = `# main.yaml
requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
    priority: high
    status: draft
`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    const reqs = readMainRequirements(testDir);

    expect(reqs).toHaveLength(1);
    expect(reqs[0].id).toBe("req-001");
    expect(reqs[0].description).toBe("Users need to search products");
    expect(reqs[0].userValue).toBe("Reduces time to find products");
    expect(reqs[0].priority).toBe("high");
    expect(reqs[0].status).toBe("draft");
  });

  test("parses valid main.yaml with multiple requirements", () => {
    const yaml = `requirements:
  - id: req-001
    description: Search products
    userValue: Faster search
    priority: high
    status: draft
  - id: req-002
    description: Save wishlist
    userValue: Return to items
    priority: medium
    status: review
`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    const reqs = readMainRequirements(testDir);

    expect(reqs).toHaveLength(2);
    expect(reqs[0].id).toBe("req-001");
    expect(reqs[1].id).toBe("req-002");
    expect(reqs[1].status).toBe("review");
  });

  test("parses empty requirements array", () => {
    const yaml = `requirements: []`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    const reqs = readMainRequirements(testDir);

    expect(reqs).toHaveLength(0);
  });

  test("throws error when main.yaml not found", () => {
    expect(() => readMainRequirements(testDir)).toThrow(/main.yaml not found/);
  });

  test("throws error when main.yaml is not valid YAML", () => {
    const yaml = `requirements:\n  - id: req-001\n    invalid: [unclosed`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    expect(() => readMainRequirements(testDir)).toThrow();
  });

  test("throws error when main.yaml is not an object", () => {
    const yaml = `just a string`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    expect(() => readMainRequirements(testDir)).toThrow(/must contain a YAML object/);
  });

  test("throws error when requirements field is missing", () => {
    const yaml = `other: field`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    expect(() => readMainRequirements(testDir)).toThrow(/must have a 'requirements' array/);
  });

  test("throws error when requirements is not an array", () => {
    const yaml = `requirements: "not an array"`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    expect(() => readMainRequirements(testDir)).toThrow(/must have a 'requirements' array/);
  });

  test("throws error when requirement has invalid priority", () => {
    const yaml = `requirements:
  - id: req-001
    description: x
    userValue: y
    priority: critical
    status: draft
`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    expect(() => readMainRequirements(testDir)).toThrow(/requirement at index 0/);
    expect(() => readMainRequirements(testDir)).toThrow(/priority/);
  });

  test("throws error when requirement has missing userValue", () => {
    const yaml = `requirements:
  - id: req-001
    description: x
    priority: high
    status: draft
`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    expect(() => readMainRequirements(testDir)).toThrow(/requirement at index 0/);
    expect(() => readMainRequirements(testDir)).toThrow(/userValue/);
  });

  test("throws error at correct index for second invalid requirement", () => {
    const yaml = `requirements:
  - id: req-001
    description: x
    userValue: y
    priority: high
    status: draft
  - id: req-002
    description: x
    userValue: y
    priority: invalid
    status: draft
`;
    writeFileSync(join(testDir, "main.yaml"), yaml, "utf-8");

    expect(() => readMainRequirements(testDir)).toThrow(/requirement at index 1/);
  });
});

describe("readDerivedRequirements", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("parses valid derived.yaml with single requirement", () => {
    const yaml = `# derived.yaml
requirements:
  - id: der-001
    description: Use Elasticsearch for search
    derivedFrom:
      - req-001
    rationale: Enables sub-200ms search
    category: technical
    priority: high
    status: draft
`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    const reqs = readDerivedRequirements(testDir);

    expect(reqs).toHaveLength(1);
    expect(reqs[0].id).toBe("der-001");
    expect(reqs[0].description).toBe("Use Elasticsearch for search");
    expect(reqs[0].derivedFrom).toEqual(["req-001"]);
    expect(reqs[0].rationale).toBe("Enables sub-200ms search");
    expect(reqs[0].category).toBe("technical");
    expect(reqs[0].priority).toBe("high");
    expect(reqs[0].status).toBe("draft");
  });

  test("parses valid derived.yaml with multiple derivedFrom", () => {
    const yaml = `requirements:
  - id: der-001
    description: Use React with TypeScript
    derivedFrom:
      - req-001
      - req-002
    rationale: Team expertise
    category: operational
    priority: high
    status: draft
`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    const reqs = readDerivedRequirements(testDir);

    expect(reqs).toHaveLength(1);
    expect(reqs[0].derivedFrom).toEqual(["req-001", "req-002"]);
    expect(reqs[0].category).toBe("operational");
  });

  test("parses empty requirements array", () => {
    const yaml = `requirements: []`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    const reqs = readDerivedRequirements(testDir);

    expect(reqs).toHaveLength(0);
  });

  test("throws error when derived.yaml not found", () => {
    expect(() => readDerivedRequirements(testDir)).toThrow(/derived.yaml not found/);
  });

  test("throws error when derived.yaml is not valid YAML", () => {
    const yaml = `requirements:\n  - id: der-001\n    invalid: [unclosed`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    expect(() => readDerivedRequirements(testDir)).toThrow();
  });

  test("throws error when derived.yaml is not an object", () => {
    const yaml = `null`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    expect(() => readDerivedRequirements(testDir)).toThrow(/must contain a YAML object/);
  });

  test("throws error when requirements field is missing", () => {
    const yaml = `other: field`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    expect(() => readDerivedRequirements(testDir)).toThrow(/must have a 'requirements' array/);
  });

  test("throws error when requirement has invalid category", () => {
    const yaml = `requirements:
  - id: der-001
    description: x
    derivedFrom:
      - req-001
    rationale: y
    category: other
    priority: high
    status: draft
`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    expect(() => readDerivedRequirements(testDir)).toThrow(/requirement at index 0/);
    expect(() => readDerivedRequirements(testDir)).toThrow(/category/);
  });

  test("throws error when derivedFrom is not an array", () => {
    const yaml = `requirements:
  - id: der-001
    description: x
    derivedFrom: req-001
    rationale: y
    category: technical
    priority: high
    status: draft
`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    expect(() => readDerivedRequirements(testDir)).toThrow(/requirement at index 0/);
    expect(() => readDerivedRequirements(testDir)).toThrow(/derivedFrom/);
  });

  test("throws error when derivedFrom contains empty string", () => {
    const yaml = `requirements:
  - id: der-001
    description: x
    derivedFrom:
      - req-001
      - ""
    rationale: y
    category: technical
    priority: high
    status: draft
`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    expect(() => readDerivedRequirements(testDir)).toThrow(/requirement at index 0/);
    expect(() => readDerivedRequirements(testDir)).toThrow(/derivedFrom/);
  });

  test("throws error at correct index for second invalid requirement", () => {
    const yaml = `requirements:
  - id: der-001
    description: x
    derivedFrom:
      - req-001
    rationale: y
    category: technical
    priority: high
    status: draft
  - id: der-002
    description: x
    derivedFrom:
      - req-001
    rationale: y
    category: invalid
    priority: high
    status: draft
`;
    writeFileSync(join(testDir, "derived.yaml"), yaml, "utf-8");

    expect(() => readDerivedRequirements(testDir)).toThrow(/requirement at index 1/);
  });
});
