import { execSync } from "node:child_process";

/**
 * Starts the Vite dev server to serve the Design Duck UI.
 * Opens the browser to the local development URL.
 */
export function ui(): void {
  if (process.env.DEBUG) {
    console.error("[design-duck:ui] Starting Vite dev server");
  }

  console.log("Starting Design Duck UI...");

  try {
    execSync("npx vite --open", {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  } catch {
    console.error("Failed to start UI server. Is Vite installed?");
    process.exitCode = 1;
  }
}
