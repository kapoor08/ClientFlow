#!/usr/bin/env node
/**
 * Bundle-size budget gate.
 *
 * Two layouts to handle:
 *   1. Next.js <= 15 (Webpack): emits `.next/app-build-manifest.json` mapping
 *      every app route to its required JS chunks. Per-route summing works.
 *   2. Next.js 16+ (Turbopack default): no app-build-manifest. Per-route chunk
 *      attribution lives in scattered `_client-reference-manifest.js` files
 *      and isn't trivially walkable. We fall back to a total-bundle check
 *      against the entire `.next/static/chunks/` directory, which still
 *      catches real regressions even without per-route granularity.
 *
 * Set BUNDLE_BUDGET_REPORT=1 for a verbose breakdown on success.
 */
import { readFileSync, statSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const NEXT_DIR = resolve(process.cwd(), ".next");
const APP_MANIFEST_PATH = join(NEXT_DIR, "app-build-manifest.json");
const STATIC_CHUNKS_DIR = join(NEXT_DIR, "static", "chunks");
const BUILD_MANIFEST_PATH = join(NEXT_DIR, "build-manifest.json");

// ── Budgets (raw bytes) ──────────────────────────────────────────────────────

// Per-route ceiling for the legacy Webpack path. A typical app-shell + feature
// page lands well under this; the common regression vector is a dialog-only
// component being statically imported into a route shell.
const DEFAULT_PER_ROUTE_BUDGET = 450 * 1024;

// Per-route overrides (only used in the legacy path). Edit when you have a
// genuinely justified heavy route.
const ROUTE_BUDGETS = {
  // example: "/page": 350 * 1024,
};

// Total-bundle ceiling for the Next.js 16 fallback. Sums every chunk in
// `.next/static/chunks/`. Generous on purpose - one user only ever downloads
// a small slice; the total catches "we accidentally added Lodash + Moment to
// the global bundle" class regressions.
const TOTAL_BUDGET_BYTES = 10 * 1024 * 1024; // 10 MB

// Shared-bundle (rootMainFiles + polyfillFiles) ceiling. These chunks load
// on every page so a regression here ripples across the whole app.
const SHARED_BUDGET_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileSize(absPath) {
  try {
    return statSync(absPath).size;
  } catch {
    return 0;
  }
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const verbose = process.env.BUNDLE_BUDGET_REPORT === "1";

// ── Path A: Next.js <= 15 (per-route via app-build-manifest.json) ───────────

function runLegacy() {
  const manifest = JSON.parse(readFileSync(APP_MANIFEST_PATH, "utf8"));
  const pages = manifest.pages ?? {};
  const reportRows = [];
  const violations = [];

  for (const [route, chunks] of Object.entries(pages)) {
    if (!Array.isArray(chunks)) continue;
    const jsChunks = chunks.filter((c) => c.endsWith(".js"));
    const totalBytes = jsChunks.reduce(
      (sum, c) => sum + fileSize(join(NEXT_DIR, c)),
      0,
    );
    const budget = ROUTE_BUDGETS[route] ?? DEFAULT_PER_ROUTE_BUDGET;
    reportRows.push({ route, totalBytes, budget });
    if (totalBytes > budget) {
      violations.push({ route, totalBytes, budget });
    }
  }

  reportRows.sort((a, b) => b.totalBytes - a.totalBytes);

  if (verbose || violations.length > 0) {
    console.log("[bundle-budget] route sizes (sorted desc):");
    for (const row of reportRows) {
      const marker = row.totalBytes > row.budget ? "FAIL" : "ok  ";
      console.log(
        `  ${marker}  ${formatKB(row.totalBytes).padStart(10)}  / budget ${formatKB(row.budget).padStart(10)}  ${row.route}`,
      );
    }
  }

  if (violations.length > 0) {
    console.error(
      `\n[bundle-budget] ${violations.length} route(s) exceed budget:`,
    );
    for (const v of violations) {
      console.error(
        `  ${v.route}: ${formatKB(v.totalBytes)} > ${formatKB(v.budget)} (over by ${formatKB(v.totalBytes - v.budget)})`,
      );
    }
    process.exit(1);
  }

  console.log(
    `[bundle-budget] all ${reportRows.length} routes within budget (legacy per-route mode).`,
  );
}

// ── Path B: Next.js 16+ (total + shared bundle check) ───────────────────────

function runNext16() {
  if (!existsSync(STATIC_CHUNKS_DIR)) {
    console.error(
      `[bundle-budget] ${STATIC_CHUNKS_DIR} not found - did "next build" run?`,
    );
    process.exit(1);
  }

  // Total: sum every .js file directly under static/chunks/. Subdirectories
  // (e.g. polyfills, framework) are walked recursively.
  let totalBytes = 0;
  let chunkCount = 0;
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        totalBytes += fileSize(abs);
        chunkCount++;
      }
    }
  }
  walk(STATIC_CHUNKS_DIR);

  // Shared bundle: rootMainFiles + polyfillFiles from build-manifest.json.
  // These load on every page; a regression here multiplies across all routes.
  let sharedBytes = 0;
  if (existsSync(BUILD_MANIFEST_PATH)) {
    try {
      const buildManifest = JSON.parse(
        readFileSync(BUILD_MANIFEST_PATH, "utf8"),
      );
      const sharedFiles = [
        ...(buildManifest.rootMainFiles ?? []),
        ...(buildManifest.polyfillFiles ?? []),
      ];
      sharedBytes = sharedFiles.reduce(
        (sum, rel) => sum + fileSize(join(NEXT_DIR, rel)),
        0,
      );
    } catch {
      // Best-effort - if the build manifest changes shape, just skip the
      // shared-bundle check rather than failing the whole step.
    }
  }

  console.log(
    `[bundle-budget] total client JS: ${formatMB(totalBytes)} (${chunkCount} chunks) / budget ${formatMB(TOTAL_BUDGET_BYTES)}`,
  );
  if (sharedBytes > 0) {
    console.log(
      `[bundle-budget] shared bundle (every page): ${formatKB(sharedBytes)} / budget ${formatKB(SHARED_BUDGET_BYTES)}`,
    );
  }

  const violations = [];
  if (totalBytes > TOTAL_BUDGET_BYTES) {
    violations.push(
      `Total client JS: ${formatMB(totalBytes)} > ${formatMB(TOTAL_BUDGET_BYTES)} (over by ${formatMB(totalBytes - TOTAL_BUDGET_BYTES)})`,
    );
  }
  if (sharedBytes > 0 && sharedBytes > SHARED_BUDGET_BYTES) {
    violations.push(
      `Shared bundle: ${formatKB(sharedBytes)} > ${formatKB(SHARED_BUDGET_BYTES)} (over by ${formatKB(sharedBytes - SHARED_BUDGET_BYTES)})`,
    );
  }

  if (violations.length > 0) {
    console.error("\n[bundle-budget] budget exceeded:");
    for (const v of violations) console.error(`  ${v}`);
    console.error(
      "\nFix: lazy-load heavy widgets via next/dynamic, audit the import graph for accidentally bundled libraries, or raise the budget in scripts/bundle-budget.mjs with justification.",
    );
    process.exit(1);
  }

  console.log("[bundle-budget] within budget.");
}

// ── Entrypoint ───────────────────────────────────────────────────────────────

function main() {
  if (existsSync(APP_MANIFEST_PATH)) {
    runLegacy();
    return;
  }
  // Next.js 16+ with Turbopack no longer emits app-build-manifest.json. Fall
  // back to the total + shared bundle check.
  runNext16();
}

main();
