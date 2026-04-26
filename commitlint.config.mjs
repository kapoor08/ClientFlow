/**
 * Conventional Commits with one tweak: subject lines may be slightly longer
 * than the 100-char default to make room for the scope, since our scope
 * names map to feature areas (`billing`, `webhook`, `time-entries`).
 *
 * Allowed types are the standard set; anything else fails the commit-msg
 * hook.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "header-max-length": [2, "always", 120],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "docs",
        "refactor",
        "test",
        "perf",
        "build",
        "ci",
        "revert",
        "style",
      ],
    ],
  },
};
