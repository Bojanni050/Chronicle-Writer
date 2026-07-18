import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Server-only. No RLS / anon-vs-service split anymore — this is the single
// entry point for all database access (this app is single-tenant, no auth).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
