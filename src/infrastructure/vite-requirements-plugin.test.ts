import { beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { requirementsWatcherPlugin } from "./vite-requirements-plugin";

describe("requirementsWatcherPlugin", () => {
  test("returns a Vite plugin with correct name", () => {
    const plugin = requirementsWatcherPlugin();

    expect(plugin.name).toBe("design-duck-requirements-watcher");
    expect(typeof plugin.configureServer).toBe("function");
  });

  test("configureServer warns when requirements/ dir does not exist", () => {
    const plugin = requirementsWatcherPlugin();
    const warnSpy = mock(() => {});
    const originalWarn = console.warn;
    console.warn = warnSpy;

    const mockServer = {
      config: { root: join(tmpdir(), `nonexistent-${Date.now()}`) },
      ws: { send: mock(() => {}) },
      httpServer: { on: mock(() => {}) },
    };

    // Should not throw, just warn
    (plugin.configureServer as Function)(mockServer);

    expect(warnSpy).toHaveBeenCalled();
    const warnMsg = (warnSpy.mock.calls as unknown[][])[0][0] as string;
    expect(warnMsg).toContain("requirements/ directory not found");

    console.warn = originalWarn;
  });

  test("configureServer sets up watcher when requirements/ dir exists", () => {
    const testDir = join(tmpdir(), `vite-plugin-test-${Date.now()}`);
    const reqDir = join(testDir, "requirements");
    mkdirSync(reqDir, { recursive: true });

    try {
      const plugin = requirementsWatcherPlugin();
      const sendMock = mock(() => {});
      const onMock = mock(() => {});

      const mockServer = {
        config: { root: testDir },
        ws: { send: sendMock },
        httpServer: { on: onMock },
      };

      // Should not throw
      (plugin.configureServer as Function)(mockServer);

      // httpServer.on("close", ...) should have been registered
      expect(onMock).toHaveBeenCalledWith("close", expect.any(Function));
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("sends HMR event when a YAML file changes", async () => {
    const testDir = join(tmpdir(), `vite-plugin-hmr-test-${Date.now()}`);
    const reqDir = join(testDir, "requirements");
    mkdirSync(reqDir, { recursive: true });

    try {
      const plugin = requirementsWatcherPlugin();
      const sendMock = mock(() => {});
      const onMock = mock(() => {});

      const mockServer = {
        config: { root: testDir },
        ws: { send: sendMock },
        httpServer: { on: onMock },
      };

      (plugin.configureServer as Function)(mockServer);

      // Wait for watcher to initialize
      await sleep(50);

      // Create a YAML file to trigger the watcher
      writeFileSync(join(reqDir, "main.yaml"), "requirements: []\n", "utf-8");

      // Wait for debounce + fs.watch propagation
      await sleep(300);

      expect(sendMock).toHaveBeenCalled();
      const calls = sendMock.mock.calls as unknown[][];
      const payload = calls[0][0] as Record<string, unknown>;
      expect(payload.type).toBe("custom");
      expect(payload.event).toBe("design-duck:requirements-changed");

      // Trigger cleanup
      const onCalls = onMock.mock.calls as unknown[][];
      const closeCall = onCalls.find(
        (c) => c[0] === "close",
      );
      const closeHandler = closeCall?.[1] as Function | undefined;
      closeHandler?.();
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
