import "@testing-library/jest-dom";

// vi is available globally via vitest's globals:true setting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const vi: any;

// server-only is aliased in vitest.config.ts - no runtime mock needed here
void vi;
