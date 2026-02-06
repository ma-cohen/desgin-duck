/**
 * Starts the Design Duck UI server.
 *
 * Serves pre-built static UI files and the consumer's desgin-duck/requirements/ YAML
 * files from a built-in HTTP server. No Vite or build tooling needed.
 */

import { join } from "node:path";
import { existsSync } from "node:fs";
import { startUiServer } from "../infrastructure/ui-server";

/**
 * Finds the dist-ui/ directory containing pre-built UI assets.
 *
 * Works both when running from source (src/commands/ui.ts) and
 * when bundled (dist/cli.js).
 */
function findDistUiDir(): string {
  // import.meta.dirname resolves to the directory of the running file:
  // - Bundled: .../dist/        → ../dist-ui/ = .../dist-ui/
  // - Source:  .../src/commands/ → ../../dist-ui/ = .../dist-ui/
  const thisDir = import.meta.dirname;
  const candidates = [
    join(thisDir, "..", "dist-ui"),
    join(thisDir, "..", "..", "dist-ui"),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw new Error(
    "UI assets not found (dist-ui/). Run 'bun run build:ui' to build the UI first.",
  );
}

export function ui(): void {
  if (process.env.DEBUG) {
    console.error("[design-duck:ui] Starting UI server");
  }

  const requirementsDir = join(process.cwd(), "desgin-duck", "requirements");

  if (!existsSync(requirementsDir)) {
    console.error(
      "desgin-duck/requirements/ directory not found. Run 'design-duck init' first.",
    );
    process.exitCode = 1;
    return;
  }

  let distUiDir: string;
  try {
    distUiDir = findDistUiDir();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  console.log("Starting Design Duck UI...");

  try {
    startUiServer({
      distUiDir,
      requirementsDir,
      port: 3456,
      open: true,
    });
  } catch (err) {
    console.error(
      `Failed to start UI server: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exitCode = 1;
  }
}
