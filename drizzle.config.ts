import type { Config } from "drizzle-kit";

export default {
  schema: "./src/services/db/schema",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
