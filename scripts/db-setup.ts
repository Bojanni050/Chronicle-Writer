import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { Client } from 'pg';

// Next.js auto-loads .env.local, but this script runs standalone via tsx.
function loadEnvFile(path: string) {
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] ?? '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

for (const file of ['.env.local', '.env']) {
  const path = join(__dirname, '..', file);
  if (existsSync(path)) loadEnvFile(path);
}

// Full local DB bootstrap, in the order each step requires:
//   1. CREATE EXTENSION vector — must exist before `drizzle-kit push` can
//      create the embeddings.embedding vector(1536) column.
//   2. drizzle-kit push — syncs lib/db/schema.ts (tables/columns/FKs/indexes).
//   3. drizzle/extra.sql — triggers, HNSW index, match_embeddings() function;
//      none of these are expressible in a Drizzle schema.
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and adjust if needed.');
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('[1/3] Creating pgvector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    console.log('[2/3] Pushing schema (drizzle-kit push)...');
    execSync('npx drizzle-kit push --force', { stdio: 'inherit' });

    console.log('[3/3] Applying triggers, HNSW index, and match_embeddings()...');
    const extraSql = readFileSync(join(__dirname, '..', 'drizzle', 'extra.sql'), 'utf8');
    await client.query(extraSql);

    console.log('Database setup complete.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
