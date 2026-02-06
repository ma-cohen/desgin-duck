import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { RequirementTree } from "./RequirementTree";
import type {
  MainRequirement,
  DerivedRequirement,
} from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MAIN_REQUIREMENTS: MainRequirement[] = [
  {
    id: "req-001",
    description: "Users need to search products",
    userValue: "Reduces time to find products",
    priority: "high",
    status: "draft",
  },
  {
    id: "req-002",
    description: "Users can save wishlists",
    userValue: "Return to considered items",
    priority: "medium",
    status: "review",
  },
];

const DERIVED_REQUIREMENTS: DerivedRequirement[] = [
  {
    id: "der-001",
    description: "Use Elasticsearch for search backend",
    derivedFrom: ["req-001"],
    rationale: "Enables sub-200ms search",
    category: "technical",
    priority: "high",
    status: "draft",
  },
  {
    id: "der-002",
    description: "Use React with TypeScript for frontend",
    derivedFrom: ["req-001", "req-002"],
    rationale: "Large hiring pool, type safety",
    category: "operational",
    priority: "high",
    status: "draft",
  },
  {
    id: "der-003",
    description: "Implement rate limiting for search API",
    derivedFrom: ["req-001"],
    rationale: "Prevent abuse and maintain performance",
    category: "quality",
    priority: "medium",
    status: "review",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RequirementTree", () => {
  // --- Loading state ---

  test("renders loading state", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={[]}
        derivedRequirements={[]}
        loading={true}
        error={null}
      />,
    );
    expect(html).toContain("tree-loading");
    expect(html).toContain("Loading requirements");
  });

  test("does not render tree when loading", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={true}
        error={null}
      />,
    );
    expect(html).not.toContain("requirement-tree");
  });

  // --- Error state ---

  test("renders error state", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={[]}
        derivedRequirements={[]}
        loading={false}
        error="Network error"
      />,
    );
    expect(html).toContain("tree-error");
    expect(html).toContain("Failed to load requirements");
    expect(html).toContain("Network error");
  });

  test("does not render tree when error", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error="Something went wrong"
      />,
    );
    expect(html).not.toContain("requirement-tree");
  });

  // --- Empty state ---

  test("renders empty state when no requirements", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={[]}
        derivedRequirements={[]}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("tree-empty");
    expect(html).toContain("No requirements found");
    expect(html).toContain("main.yaml");
  });

  // --- Tree structure ---

  test("renders tree container", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("requirement-tree");
  });

  test("renders tree nodes for each main requirement", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("tree-node-req-001");
    expect(html).toContain("tree-node-req-002");
  });

  test("renders main requirement cards inside tree nodes", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("requirement-card-req-001");
    expect(html).toContain("requirement-card-req-002");
  });

  // --- Derived requirements traceability ---

  test("renders derived requirements under their parent", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    // der-001 is derived from req-001
    expect(html).toContain("derived-item-der-001");
    // der-002 is derived from both req-001 and req-002
    expect(html).toContain("derived-item-der-002");
    // der-003 is derived from req-001
    expect(html).toContain("derived-item-der-003");
  });

  test("renders derived list container for parent with children", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    // req-001 has derived requirements
    expect(html).toContain("derived-list-req-001");
    // req-002 also has der-002
    expect(html).toContain("derived-list-req-002");
  });

  test("shows derived requirement count", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    // req-001 has 3 derived (der-001, der-002, der-003)
    expect(html).toContain("Derived Requirements (3)");
    // req-002 has 1 derived (der-002)
    expect(html).toContain("Derived Requirements (1)");
  });

  test("renders category badges for derived requirements", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("category-badge-der-001");
    expect(html).toContain("technical");
    expect(html).toContain("category-badge-der-002");
    expect(html).toContain("operational");
    expect(html).toContain("category-badge-der-003");
    expect(html).toContain("quality");
  });

  test("renders priority badges for derived requirements", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("priority-badge-der-001");
    expect(html).toContain("priority-badge-der-002");
    expect(html).toContain("priority-badge-der-003");
  });

  test("renders derived requirement description and rationale", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("Use Elasticsearch for search backend");
    expect(html).toContain("Enables sub-200ms search");
    expect(html).toContain("Use React with TypeScript for frontend");
    expect(html).toContain("Large hiring pool, type safety");
  });

  // --- Edge case: derived requirement linked to multiple parents ---

  test("shared derived requirement appears under each parent", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={MAIN_REQUIREMENTS}
        derivedRequirements={DERIVED_REQUIREMENTS}
        loading={false}
        error={null}
      />,
    );
    // der-002 derives from both req-001 and req-002
    // Both tree nodes should have a derived-list containing der-002
    // We check that derived-list appears for both parents
    expect(html).toContain("derived-list-req-001");
    expect(html).toContain("derived-list-req-002");
  });

  // --- Edge case: main requirement with no derived requirements ---

  test("does not render derived list when no children exist", () => {
    const mainOnly: MainRequirement[] = [
      {
        id: "req-solo",
        description: "Standalone requirement",
        userValue: "Exists alone",
        priority: "low",
        status: "approved",
      },
    ];
    const html = renderToString(
      <RequirementTree
        mainRequirements={mainOnly}
        derivedRequirements={[]}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("tree-node-req-solo");
    expect(html).toContain("requirement-card-req-solo");
    expect(html).not.toContain("derived-list-req-solo");
  });

  // --- Category styling ---

  test("applies correct category styling for technical", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={[MAIN_REQUIREMENTS[0]]}
        derivedRequirements={[DERIVED_REQUIREMENTS[0]]}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("bg-purple-100");
    expect(html).toContain("text-purple-800");
  });

  test("applies correct category styling for operational", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={[MAIN_REQUIREMENTS[0]]}
        derivedRequirements={[DERIVED_REQUIREMENTS[1]]}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("bg-indigo-100");
    expect(html).toContain("text-indigo-800");
  });

  test("applies correct category styling for quality", () => {
    const html = renderToString(
      <RequirementTree
        mainRequirements={[MAIN_REQUIREMENTS[0]]}
        derivedRequirements={[DERIVED_REQUIREMENTS[2]]}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("bg-teal-100");
    expect(html).toContain("text-teal-800");
  });
});
