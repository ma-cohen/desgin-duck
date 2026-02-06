import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { useRequirementsStore } from "./requirements-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_MAIN_YAML = `requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
    priority: high
    status: draft
  - id: req-002
    description: Users can save wishlists
    userValue: Return to considered items
    priority: medium
    status: review
`;

const VALID_DERIVED_YAML = `requirements:
  - id: der-001
    description: Use Elasticsearch for search
    derivedFrom:
      - req-001
    rationale: Sub-200ms search
    category: technical
    priority: high
    status: draft
`;

const EMPTY_YAML = `requirements: []`;

function makeResponse(body: string, ok = true, status = 200): Response {
  return new Response(body, {
    status,
    statusText: ok ? "OK" : "Not Found",
  });
}

/** Stub globalThis.fetch so it returns canned responses for main.yaml / derived.yaml. */
function stubFetch(
  mainBody: string | null,
  derivedBody: string | null,
  options?: { mainStatus?: number; derivedStatus?: number },
) {
  const mainStatus = options?.mainStatus ?? (mainBody === null ? 404 : 200);
  const derivedStatus =
    options?.derivedStatus ?? (derivedBody === null ? 404 : 200);

  const fn = mock((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
    if (urlStr.includes("main.yaml")) {
      return Promise.resolve(
        makeResponse(mainBody ?? "", mainStatus >= 200 && mainStatus < 300, mainStatus),
      );
    }
    if (urlStr.includes("derived.yaml")) {
      return Promise.resolve(
        makeResponse(
          derivedBody ?? "",
          derivedStatus >= 200 && derivedStatus < 300,
          derivedStatus,
        ),
      );
    }
    return Promise.resolve(makeResponse("", false, 404));
  });

  globalThis.fetch = fn as unknown as typeof globalThis.fetch;
  return fn;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useRequirementsStore", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset store to initial state before each test
    useRequirementsStore.setState({
      mainRequirements: [],
      derivedRequirements: [],
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // --- Initial state ---

  test("has correct initial state", () => {
    const state = useRequirementsStore.getState();

    expect(state.mainRequirements).toEqual([]);
    expect(state.derivedRequirements).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  // --- Successful loads ---

  test("loadFromFiles() populates main and derived requirements", async () => {
    stubFetch(VALID_MAIN_YAML, VALID_DERIVED_YAML);

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.mainRequirements).toHaveLength(2);
    expect(state.mainRequirements[0].id).toBe("req-001");
    expect(state.mainRequirements[1].id).toBe("req-002");
    expect(state.derivedRequirements).toHaveLength(1);
    expect(state.derivedRequirements[0].id).toBe("der-001");
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test("loadFromFiles() handles empty requirements arrays", async () => {
    stubFetch(EMPTY_YAML, EMPTY_YAML);

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.mainRequirements).toEqual([]);
    expect(state.derivedRequirements).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test("loadFromFiles() uses custom requirements path", async () => {
    const fetchMock = stubFetch(VALID_MAIN_YAML, VALID_DERIVED_YAML);

    await useRequirementsStore.getState().loadFromFiles("/custom/path");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const calls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain("/custom/path/main.yaml");
    expect(calls).toContain("/custom/path/derived.yaml");
  });

  test("loadFromFiles() defaults to /requirements path", async () => {
    const fetchMock = stubFetch(VALID_MAIN_YAML, VALID_DERIVED_YAML);

    await useRequirementsStore.getState().loadFromFiles();

    const calls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain("/requirements/main.yaml");
    expect(calls).toContain("/requirements/derived.yaml");
  });

  // --- Fetch errors ---

  test("loadFromFiles() sets error when main.yaml fetch fails", async () => {
    stubFetch(null, VALID_DERIVED_YAML, { mainStatus: 404 });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toContain("main.yaml");
    expect(state.error).toContain("404");
    expect(state.loading).toBe(false);
    expect(state.mainRequirements).toEqual([]);
  });

  test("loadFromFiles() sets error when derived.yaml fetch fails", async () => {
    stubFetch(VALID_MAIN_YAML, null, { derivedStatus: 500 });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toContain("derived.yaml");
    expect(state.error).toContain("500");
    expect(state.loading).toBe(false);
  });

  // --- Parse errors ---

  test("loadFromFiles() sets error when main.yaml has invalid YAML", async () => {
    stubFetch("not: valid: yaml: [", VALID_DERIVED_YAML);

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.loading).toBe(false);
  });

  test("loadFromFiles() sets error when main.yaml has invalid requirement", async () => {
    const badMain = `requirements:
  - id: req-001
    description: x
    priority: invalid
    status: draft
`;
    stubFetch(badMain, VALID_DERIVED_YAML);

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.loading).toBe(false);
    expect(state.mainRequirements).toEqual([]);
  });

  test("loadFromFiles() sets error when derived.yaml has invalid requirement", async () => {
    const badDerived = `requirements:
  - id: der-001
    description: x
    derivedFrom: not-an-array
    rationale: y
    category: invalid
    priority: high
    status: draft
`;
    stubFetch(VALID_MAIN_YAML, badDerived);

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.loading).toBe(false);
  });

  // --- Loading state ---

  test("loadFromFiles() sets loading to true while in progress", async () => {
    // Use a deferred response so we can inspect state mid-load
    let resolveMain!: (r: Response) => void;
    const mainPromise = new Promise<Response>((r) => {
      resolveMain = r;
    });

    globalThis.fetch = mock((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
      if (urlStr.includes("main.yaml")) return mainPromise;
      return Promise.resolve(makeResponse(VALID_DERIVED_YAML));
    }) as unknown as typeof globalThis.fetch;

    const loadPromise = useRequirementsStore.getState().loadFromFiles();

    // While the fetch is pending, loading should be true
    expect(useRequirementsStore.getState().loading).toBe(true);

    // Resolve the fetch
    resolveMain(makeResponse(VALID_MAIN_YAML));
    await loadPromise;

    expect(useRequirementsStore.getState().loading).toBe(false);
  });

  test("loadFromFiles() clears previous error on retry", async () => {
    // First call: fail
    stubFetch(null, VALID_DERIVED_YAML, { mainStatus: 404 });
    await useRequirementsStore.getState().loadFromFiles();
    expect(useRequirementsStore.getState().error).toBeTruthy();

    // Second call: succeed
    stubFetch(VALID_MAIN_YAML, VALID_DERIVED_YAML);
    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toBeNull();
    expect(state.mainRequirements).toHaveLength(2);
  });

  test("loadFromFiles() replaces previous requirements on reload", async () => {
    // First load
    stubFetch(VALID_MAIN_YAML, VALID_DERIVED_YAML);
    await useRequirementsStore.getState().loadFromFiles();
    expect(useRequirementsStore.getState().mainRequirements).toHaveLength(2);

    // Second load with different data
    const singleMain = `requirements:
  - id: req-099
    description: New requirement
    userValue: New value
    priority: low
    status: approved
`;
    stubFetch(singleMain, EMPTY_YAML);
    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.mainRequirements).toHaveLength(1);
    expect(state.mainRequirements[0].id).toBe("req-099");
    expect(state.derivedRequirements).toEqual([]);
  });

  // --- Requirement data fidelity ---

  test("loadFromFiles() preserves all main requirement fields", async () => {
    stubFetch(VALID_MAIN_YAML, EMPTY_YAML);

    await useRequirementsStore.getState().loadFromFiles();

    const req = useRequirementsStore.getState().mainRequirements[0];
    expect(req).toEqual({
      id: "req-001",
      description: "Users need to search products",
      userValue: "Reduces time to find products",
      priority: "high",
      status: "draft",
    });
  });

  test("loadFromFiles() preserves all derived requirement fields", async () => {
    stubFetch(EMPTY_YAML, VALID_DERIVED_YAML);

    await useRequirementsStore.getState().loadFromFiles();

    const req = useRequirementsStore.getState().derivedRequirements[0];
    expect(req).toEqual({
      id: "der-001",
      description: "Use Elasticsearch for search",
      derivedFrom: ["req-001"],
      rationale: "Sub-200ms search",
      category: "technical",
      priority: "high",
      status: "draft",
    });
  });
});
