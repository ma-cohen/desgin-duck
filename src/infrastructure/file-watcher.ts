/**
 * File watcher for the requirements/ directory.
 *
 * Watches for YAML file changes (create, modify, delete) and invokes a
 * callback after a debounce period. This enables real-time UI updates when
 * an AI agent or user edits requirement files on disk.
 *
 * Uses Node/Bun `fs.watch` under the hood. The watcher is debounced so that
 * rapid successive file changes (e.g. editor save + write) result in a single
 * callback invocation.
 */

import { watch, existsSync, type FSWatcher } from "node:fs";
import { join, extname } from "node:path";

/** Options for configuring the file watcher. */
export interface FileWatcherOptions {
  /**
   * Debounce delay in milliseconds. Multiple changes within this window
   * are collapsed into a single callback invocation.
   * @default 100
   */
  debounceMs?: number;
}

/** Handle returned by `watchRequirementsDir` to control the watcher lifecycle. */
export interface FileWatcherHandle {
  /** Stops watching and releases all resources. Safe to call multiple times. */
  close: () => void;
}

/**
 * Watches a requirements directory for YAML file changes and invokes
 * `onChange` after a debounce period.
 *
 * @param requirementsDir - Absolute or relative path to the requirements/ directory
 * @param onChange - Callback invoked when YAML files change (after debounce)
 * @param options - Optional configuration (debounce timing)
 * @returns A handle with a `close()` method to stop watching
 * @throws Error if the directory does not exist
 *
 * @example
 * ```ts
 * const handle = watchRequirementsDir("./requirements", () => {
 *   console.log("Requirements changed, reloading...");
 *   store.loadFromFiles();
 * });
 *
 * // Later, to stop watching:
 * handle.close();
 * ```
 */
export function watchRequirementsDir(
  requirementsDir: string,
  onChange: () => void,
  options: FileWatcherOptions = {},
): FileWatcherHandle {
  const { debounceMs = 100 } = options;

  if (!existsSync(requirementsDir)) {
    throw new Error(
      `Cannot watch requirements directory: ${requirementsDir} does not exist`,
    );
  }

  if (process.env.DEBUG) {
    console.error(
      `[file-watcher] Starting watcher on: ${requirementsDir} (debounce: ${debounceMs}ms)`,
    );
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const debouncedOnChange = () => {
    if (closed) return;

    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (!closed) {
        if (process.env.DEBUG) {
          console.error("[file-watcher] Debounce elapsed, invoking onChange callback");
        }
        onChange();
      }
    }, debounceMs);
  };

  let watcher: FSWatcher;

  try {
    watcher = watch(requirementsDir, (eventType, filename) => {
      if (closed) return;

      // On some platforms (macOS) filename can be null.
      // When null, we trigger the callback defensively since we can't
      // determine the file type.
      if (filename === null || isYamlFile(filename)) {
        if (process.env.DEBUG) {
          const target = filename
            ? join(requirementsDir, filename)
            : "(unknown file)";
          console.error(
            `[file-watcher] Detected ${eventType} on: ${target}`,
          );
        }
        debouncedOnChange();
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to start file watcher on ${requirementsDir}: ${msg}`);
  }

  watcher.on("error", (err) => {
    if (process.env.DEBUG) {
      console.error(`[file-watcher] Watcher error: ${err.message}`);
    }
  });

  const close = () => {
    if (closed) return;
    closed = true;

    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    watcher.close();

    if (process.env.DEBUG) {
      console.error("[file-watcher] Watcher closed");
    }
  };

  return { close };
}

/**
 * Checks whether a filename has a YAML extension (.yaml or .yml).
 */
function isYamlFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return ext === ".yaml" || ext === ".yml";
}
