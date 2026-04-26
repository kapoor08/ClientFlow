#!/usr/bin/env node
/**
 * Bundle-size budget gate.
 *
 * Reads `.next/app-build-manifest.json` to find every app-router route, sums
 * the on-disk byte size of its required JS chunks, and fails the build when
 * any route exceeds its budget. Run after `next build`.
 *
 * Why per-route, not just shared bundle: a heavy widget on a single rarely-
 * visited page is a cheaper regression than a heavy shared chunk that loads
 * everywhere. The budget makes that trade-off explicit per route.
 *
 * Budgets are raw (uncompressed) bytes. Gzip would be more representative of
 * wire size, but it's a moving target across CDN configs - raw bytes correlate
 * tightly enough and stay deterministic across environments.
 *
 * To override a budget for a specific route, edit ROUTE_BUDGETS below.
 * Set BUNDLE_BUDGET_REPORT=1 to print the full per-route report even on pass.
 */
import { readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const NEXT_DIR = resolve(process.cwd(), ".next");
const MANIFEST_PATH = join(NEXT_DIR, "app-build-manifest.json");

// Default budget for any route not listed below. 450KB raw covers a typical
// app-shell + a feature page; tune down once we have a baseline.
const DEFAULT_BUDGET_BYTES = 450 * 1024;

// Per-route overrides. Keys are the route paths Next emits in the manifest
// (e.g. "/page", "/(protected)/clients/page"). Values are byte budgets.
const ROUTE_BUDGETS = {
  // example: "/page": 350 * 1024,
};

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(
      `[bundle-budget] ${MANIFEST_PATH} not found - did "next build" run?`,
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function fileSize(relPath) {
  // Manifest paths are relative to .next/, e.g. "static/chunks/app/layout.js"
  const abs = join(NEXT_DIR, relPath);
  try {
    return statSync(abs).size;
  } catch {
    return 0;
  }
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  const manifest = loadManifest();
  // app-build-manifest.json shape: { pages: { "/page": ["static/chunks/..."] } }
  const pages = manifest.pages ?? {};
  const reportRows = [];
  const violations = [];

  for (const [route, chunks] of Object.entries(pages)) {
    if (!Array.isArray(chunks)) continue;
    // Only count JS - CSS contributes to first-load but Next reports it
    // separately and it's typically small. Keep the gate JS-focused.
    const jsChunks = chunks.filter((c) => c.endsWith(".js"));
    const totalBytes = jsChunks.reduce((sum, c) => sum + fileSize(c), 0);
    const budget = ROUTE_BUDGETS[route] ?? DEFAULT_BUDGET_BYTES;
    reportRows.push({ route, totalBytes, budget, chunkCount: jsChunks.length });
    if (totalBytes > budget) {
      violations.push({ route, totalBytes, budget });
    }
  }

  reportRows.sort((a, b) => b.totalBytes - a.totalBytes);

  const verbose = process.env.BUNDLE_BUDGET_REPORT === "1";
  if (verbose || violations.length > 0) {
    console.log("[bundle-budget] route sizes (sorted desc):");
    for (const row of reportRows) {
      const overBudget = row.totalBytes > row.budget;
      const marker = overBudget ? "FAIL" : "ok  ";
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
    console.error(
      "\nFix: trim imports, dynamic-import heavy widgets, or raise the budget in scripts/bundle-budget.mjs with justification.",
    );
    process.exit(1);
  }

  console.log(
    `[bundle-budget] all ${reportRows.length} routes within budget.`,
  );
}

main();
