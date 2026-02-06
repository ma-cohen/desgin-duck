/**
 * Vite plugin that watches the desgin-duck/requirements/ directory for YAML changes
 * and notifies the browser via HMR custom events.
 *
 * Uses the existing file-watcher infrastructure to detect filesystem changes
 * and sends a "design-duck:requirements-changed" HMR event so the Zustand
 * store can auto-reload requirements without polling.
 */

import { join } from "node:path";
import { existsSync } from "node:fs";
import { watchRequirementsDir } from "./file-watcher";
import type { Plugin } from "vite";

/**
 * Creates a Vite plugin that watches the desgin-duck/requirements/ directory
 * and sends HMR events when YAML files change.
 *
 * @returns Vite plugin instance
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { requirementsWatcherPlugin } from "./src/infrastructure/vite-requirements-plugin";
 *
 * export default defineConfig({
 *   plugins: [requirementsWatcherPlugin()],
 * });
 * ```
 */
export function requirementsWatcherPlugin(): Plugin {
  return {
    name: "design-duck-requirements-watcher",

    configureServer(server) {
      const requirementsDir = join(server.config.root, "desgin-duck", "requirements");

      if (!existsSync(requirementsDir)) {
        console.warn(
          "[design-duck:vite] desgin-duck/requirements/ directory not found, skipping file watcher",
        );
        return;
      }

      console.log(
        `[design-duck:vite] Watching ${requirementsDir} for YAML changes`,
      );

      const handle = watchRequirementsDir(requirementsDir, () => {
        console.log(
          "[design-duck:vite] Requirements changed, notifying browser",
        );
        server.ws.send({
          type: "custom",
          event: "design-duck:requirements-changed",
          data: {},
        });
      });

      // Clean up watcher when the server closes
      server.httpServer?.on("close", () => {
        handle.close();
        console.log("[design-duck:vite] File watcher closed");
      });
    },
  };
}
