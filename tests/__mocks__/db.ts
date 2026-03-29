// Mock for @/lib/db — prevents actual DB connections during unit tests
// vi is a global injected by vitest; this file only runs in test context
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const vi: any;

export const db = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};
