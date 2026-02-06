/**
 * Built-in HTTP server for the Design Duck UI.
 *
 * Serves three things:
 * 1. Pre-built static UI files from dist-ui/ (shipped with the package)
 * 2. Requirements YAML files from the consumer's project (process.cwd())
 * 3. An SSE endpoint (/events) for real-time file change notifications
 *
 * This removes the need for Vite or any build tooling in consuming projects.
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";
import { watchRequirementsDir } from "./file-watcher";
import type { FileWatcherHandle } from "./file-watcher";

/** Options for starting the UI server. */
export interface UiServerOptions {
  /** Port to listen on. @default 3456 */
  port?: number;
  /** Absolute path to the dist-ui/ directory with pre-built UI files. */
  distUiDir: string;
  /** Absolute path to the desgin-duck/requirements/ directory to serve YAML files from. */
  requirementsDir: string;
  /** Whether to open the browser automatically. @default true */
  open?: boolean;
}

/** Handle returned by startUiServer to control the server lifecycle. */
export interface UiServerHandle {
  /** Stop the server and release all resources. */
  close: () => void;
  /** The port the server is listening on. */
  port: number;
}

// ---------------------------------------------------------------------------
// MIME type mapping
// ---------------------------------------------------------------------------

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

/**
 * Starts the Design Duck UI server.
 *
 * @param options - Server configuration
 * @returns A handle with a `close()` method and the actual port
 * @throws Error if dist-ui/ or desgin-duck/requirements/ directories are missing
 */
export function startUiServer(options: UiServerOptions): UiServerHandle {
  const { port = 3456, distUiDir, requirementsDir, open = true } = options;

  if (!existsSync(distUiDir)) {
    throw new Error(
      `UI assets not found at ${distUiDir}. Run 'bun run build:ui' first.`,
    );
  }

  if (!existsSync(requirementsDir)) {
    throw new Error(
      `desgin-duck/requirements/ not found at ${requirementsDir}. Run 'design-duck init' first.`,
    );
  }

  console.log(
    `[design-duck:server] Serving UI from: ${distUiDir}`,
  );
  console.log(
    `[design-duck:server] Serving requirements from: ${requirementsDir}`,
  );

  // Track connected SSE clients (scoped to this server instance)
  const sseClients = new Set<ServerResponse>();

  // Set up file watcher to push SSE events on YAML changes
  let watcherHandle: FileWatcherHandle | null = null;
  try {
    watcherHandle = watchRequirementsDir(requirementsDir, () => {
      console.log(
        `[design-duck:server] Requirements changed, notifying ${sseClients.size} client(s)`,
      );
      for (const client of sseClients) {
        client.write("event: requirements-changed\ndata: {}\n\n");
      }
    });
    console.log("[design-duck:server] File watcher active on requirements/");
  } catch (err) {
    console.warn(
      `[design-duck:server] Could not start file watcher: ${err instanceof Error ? err.message : err}`,
    );
  }

  // Create HTTP server
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const pathname = url.pathname;

    if (process.env.DEBUG) {
      console.error(`[design-duck:server] ${req.method} ${pathname}`);
    }

    // SSE endpoint for file change notifications
    if (pathname === "/events") {
      handleSSE(res, sseClients);
      return;
    }

    // Serve requirements YAML files from the consumer's project
    if (pathname.startsWith("/requirements/")) {
      const filename = pathname.slice("/requirements/".length);
      const filePath = join(requirementsDir, filename);
      serveFile(filePath, res);
      return;
    }

    // Serve pre-built static UI files
    let filePath = join(distUiDir, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(filePath)) {
      // SPA fallback: serve index.html for unmatched routes
      filePath = join(distUiDir, "index.html");
    }
    serveFile(filePath, res);
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\nDesign Duck UI running at ${url}\n`);

    if (open) {
      openBrowser(url);
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Try a different port with --port.`,
      );
    } else {
      console.error(`[design-duck:server] Server error: ${err.message}`);
    }
  });

  return {
    port,
    close: () => {
      console.log("[design-duck:server] Shutting down...");
      watcherHandle?.close();
      for (const client of sseClients) {
        client.end();
      }
      sseClients.clear();
      server.close();
    },
  };
}

// ---------------------------------------------------------------------------
// SSE handler
// ---------------------------------------------------------------------------

function handleSSE(
  res: ServerResponse,
  clients: Set<ServerResponse>,
): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial connection event
  res.write("event: connected\ndata: {}\n\n");

  clients.add(res);
  console.log(
    `[design-duck:server] SSE client connected (${clients.size} total)`,
  );

  res.on("close", () => {
    clients.delete(res);
    console.log(
      `[design-duck:server] SSE client disconnected (${clients.size} remaining)`,
    );
  });
}

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

function serveFile(filePath: string, res: ServerResponse): void {
  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
}

// ---------------------------------------------------------------------------
// Browser opener
// ---------------------------------------------------------------------------

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";

  try {
    execSync(`${cmd} ${url}`, { stdio: "ignore" });
  } catch {
    // Silently fail — user can open manually
  }
}
