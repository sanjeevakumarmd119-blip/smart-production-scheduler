import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

let dbInstance: any = null;

export function getDb() {
  if (!databaseUrl) {
    return null;
  }
  if (!dbInstance) {
    try {
      const pool = new Pool({ connectionString: databaseUrl });
      dbInstance = drizzle(pool, { schema });
    } catch (e) {
      console.warn("Failed to initialize Neon PostgreSQL connection:", e);
      return null;
    }
  }
  return dbInstance;
}

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

