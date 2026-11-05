import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const journals = sqliteTable('journals', {
  userId: text('user_id').primaryKey(),
  body: text('body').notNull(),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
});
