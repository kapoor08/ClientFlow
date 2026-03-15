import { boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./helpers";

export const contentEntries = pgTable("content_entries", {
  id: text("id").primaryKey(),
  pageKey: text("page_key").notNull(),
  blockKey: text("block_key").notNull(),
  data: jsonb("data").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
