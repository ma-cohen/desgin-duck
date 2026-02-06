import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { init } from "./init";

describe("init", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    process.exitCode = 0;
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    process.exitCode = 0;
  });

  test("creates desgin-duck/requirements/ directory", () => {
    init(testDir);
    expect(existsSync(join(testDir, "desgin-duck", "requirements"))).toBe(true);
  });

  test("creates project.yaml, main.yaml, derived.yaml", () => {
    init(testDir);
    const reqDir = join(testDir, "desgin-duck", "requirements");
    expect(existsSync(join(reqDir, "project.yaml"))).toBe(true);
    expect(existsSync(join(reqDir, "main.yaml"))).toBe(true);
    expect(existsSync(join(reqDir, "derived.yaml"))).toBe(true);
  });

  test("project.yaml contains name and description fields", () => {
    init(testDir);
    const content = readFileSync(join(testDir, "desgin-duck", "requirements", "project.yaml"), "utf-8");
    expect(content).toContain("name:");
    expect(content).toContain("description:");
  });

  test("main.yaml contains empty requirements array", () => {
    init(testDir);
    const content = readFileSync(join(testDir, "desgin-duck", "requirements", "main.yaml"), "utf-8");
    expect(content).toContain("requirements: []");
  });

  test("derived.yaml contains empty requirements array", () => {
    init(testDir);
    const content = readFileSync(join(testDir, "desgin-duck", "requirements", "derived.yaml"), "utf-8");
    expect(content).toContain("requirements: []");
  });

  test("aborts with exit code 1 if desgin-duck/requirements/ already exists", () => {
    mkdirSync(join(testDir, "desgin-duck", "requirements"), { recursive: true });
    init(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("does not create files when desgin-duck/requirements/ already exists", () => {
    mkdirSync(join(testDir, "desgin-duck", "requirements"), { recursive: true });
    init(testDir);
    expect(existsSync(join(testDir, "desgin-duck", "requirements", "project.yaml"))).toBe(false);
  });

  test("initializes git repo when .git does not exist", () => {
    init(testDir);
    expect(existsSync(join(testDir, ".git"))).toBe(true);
  });

  test("skips git init when .git already exists", () => {
    mkdirSync(join(testDir, ".git"));
    init(testDir);
    // .git should still be a plain directory (not replaced by real git init)
    expect(existsSync(join(testDir, ".git", "HEAD"))).toBe(false);
  });
});
