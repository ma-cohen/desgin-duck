import { afterEach, beforeEach, describe, expect, test, mock } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { watchRequirementsDir } from "./file-watcher";
import type { FileWatcherHandle } from "./file-watcher";

describe("watchRequirementsDir", () => {
  let testDir: string;
  let handle: FileWatcherHandle | null;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-watcher-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    handle = null;
  });

  afterEach(() => {
    handle?.close();
    rmSync(testDir, { recursive: true, force: true });
  });

  test("throws error when directory does not exist", () => {
    const missingDir = join(testDir, "nonexistent");

    expect(() =>
      watchRequirementsDir(missingDir, () => {}),
    ).toThrow(/does not exist/);
  });

  test("returns a handle with a close method", () => {
    handle = watchRequirementsDir(testDir, () => {});

    expect(handle).toBeDefined();
    expect(typeof handle.close).toBe("function");
  });

  test("close can be called multiple times without error", () => {
    handle = watchRequirementsDir(testDir, () => {});

    handle.close();
    handle.close();
    handle.close();
    // Should not throw
    handle = null; // prevent afterEach from closing again
  });

  test("invokes callback when a YAML file is created", async () => {
    const onChange = mock(() => {});

    handle = watchRequirementsDir(testDir, onChange, { debounceMs: 50 });

    // Small delay to let fs.watch fully initialize
    await sleep(50);

    // Create a YAML file
    writeFileSync(join(testDir, "main.yaml"), "requirements: []\n", "utf-8");

    // Wait for debounce + fs.watch propagation
    await sleep(300);

    expect(onChange).toHaveBeenCalled();
  });

  test("invokes callback when a YAML file is modified", async () => {
    // Create the file before watching
    writeFileSync(join(testDir, "main.yaml"), "requirements: []\n", "utf-8");

    const onChange = mock(() => {});
    handle = watchRequirementsDir(testDir, onChange, { debounceMs: 50 });

    // Modify the file
    writeFileSync(
      join(testDir, "main.yaml"),
      "requirements:\n  - id: req-001\n    description: test\n    userValue: v\n    priority: high\n    status: draft\n",
      "utf-8",
    );

    await sleep(200);

    expect(onChange).toHaveBeenCalled();
  });

  test("does not invoke callback for non-YAML files", async () => {
    const onChange = mock(() => {});
    handle = watchRequirementsDir(testDir, onChange, { debounceMs: 50 });

    // Create a non-YAML file
    writeFileSync(join(testDir, "readme.md"), "# Hello\n", "utf-8");

    await sleep(200);

    expect(onChange).not.toHaveBeenCalled();
  });

  test("invokes callback for .yml extension", async () => {
    const onChange = mock(() => {});
    handle = watchRequirementsDir(testDir, onChange, { debounceMs: 50 });

    writeFileSync(join(testDir, "extra.yml"), "data: true\n", "utf-8");

    await sleep(200);

    expect(onChange).toHaveBeenCalled();
  });

  test("debounces rapid changes into a single callback", async () => {
    const onChange = mock(() => {});
    handle = watchRequirementsDir(testDir, onChange, { debounceMs: 100 });

    // Rapid successive writes
    writeFileSync(join(testDir, "main.yaml"), "requirements: []\n", "utf-8");
    await sleep(10);
    writeFileSync(join(testDir, "main.yaml"), "requirements:\n  - id: r1\n    description: a\n    userValue: b\n    priority: high\n    status: draft\n", "utf-8");
    await sleep(10);
    writeFileSync(join(testDir, "main.yaml"), "requirements:\n  - id: r2\n    description: c\n    userValue: d\n    priority: low\n    status: draft\n", "utf-8");

    // Wait for debounce to settle
    await sleep(300);

    // Should have been called only once (or at most twice due to fs timing),
    // but definitely fewer than 3 times
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(2);
    expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("does not invoke callback after close", async () => {
    const onChange = mock(() => {});
    handle = watchRequirementsDir(testDir, onChange, { debounceMs: 50 });

    handle.close();
    handle = null;

    // Write after closing
    writeFileSync(join(testDir, "main.yaml"), "requirements: []\n", "utf-8");

    await sleep(200);

    expect(onChange).not.toHaveBeenCalled();
  });

  test("uses default debounce when not specified", () => {
    // Should not throw — just verifying the default works
    handle = watchRequirementsDir(testDir, () => {});

    expect(handle).toBeDefined();
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
