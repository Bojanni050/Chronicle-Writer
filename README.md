# Chronicle-Writer

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-3efjzzpw)

## Local development

The app persists to Postgres via [Drizzle ORM](https://orm.drizzle.team/) — no hosted service required.

1. **Start Postgres.** Easiest via Docker:
   ```
   docker compose up -d
   ```
   This runs `pgvector/pgvector:pg16` (Postgres with the pgvector extension preinstalled) on `localhost:5432` with user/password/db all `inkwell`.

   If port 5432 is already taken (e.g. by a native Postgres install), override it without editing the compose file:
   ```
   INKWELL_DB_PORT=5433 docker compose up -d
   ```
   and match that port in `DATABASE_URL` below.

   Alternatively, point at any local Postgres install instead — just make sure the [pgvector extension](https://github.com/pgvector/pgvector) is installed, since the AI retrieval feature stores embeddings in a `vector` column.

2. **Configure env vars.**
   ```
   cp .env.example .env.local
   ```
   The default `DATABASE_URL` matches the docker-compose defaults; adjust if you're pointing at a different instance. AI provider keys are optional — everything degrades to a stub provider when unset.

3. **Set up the database schema.**
   ```
   npm run db:setup
   ```
   This creates the `vector` extension, pushes the Drizzle schema (`lib/db/schema.ts`), and applies the trigger/index/function SQL in `drizzle/extra.sql` (updated_at triggers, the HNSW similarity index, and the `match_embeddings()` function used by retrieval). Safe to re-run.

4. **Run the app.**
   ```
   npm run dev
   ```

Other useful scripts: `npm run db:push` (sync schema changes only), `npm run db:studio` (Drizzle Studio, a local DB browser).

### Uploaded content

Character photos are stored on the local filesystem under `public/uploads/` (served directly by Next.js). Locally this is just a folder; in the Docker/VM deploy below it's a named volume so it survives container recreation.

## Deploying to a VM with Docker Compose

`docker-compose.prod.yml` runs the app, Postgres, and a [Caddy](https://caddyserver.com/) reverse proxy — everything needed is `docker compose` and a `.env` file, no separate build/deploy pipeline. Caddy is the only service exposed to the internet (ports 80/443); the app and database are only reachable on the internal Docker network.

1. Clone the repo on the VM.
2. ```
   cp .env.production.example .env
   ```
   Fill in AI provider keys if you want real AI output instead of the stub provider. `DATABASE_URL` is not set here — it's hardcoded in `docker-compose.prod.yml` to the internal `db` container hostname, since Postgres isn't exposed outside the compose network in this file.
3. ```
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   This builds the app image, starts Postgres, waits for it to be healthy, runs the same `npm run db:setup` used locally before starting the server (safe to rerun on every restart — the schema push and trigger/index/function SQL are all idempotent), then starts Caddy in front of it.
4. Check `curl -k https://localhost/api/health` returns `{"status":"ok"}` (`-k` because, without a domain, the cert is self-signed — see below).

### TLS

- **No domain yet / testing:** leave `DOMAIN` unset in `.env`. Caddy serves over HTTPS using its own self-signed certificate — browsers will show a "not trusted" warning, which is expected.
- **Real domain:** point the domain's DNS A record at the VM's IP, set `DOMAIN=yourdomain.com` in `.env`, then `docker compose -f docker-compose.prod.yml up -d`. Caddy automatically requests and renews a real Let's Encrypt certificate and redirects HTTP to HTTPS — no other config needed.
- If port 80 or 443 is already taken on the host, override with `CADDY_HTTP_PORT` / `CADDY_HTTPS_PORT` in `.env` (real Let's Encrypt certs require the standard ports reachable from the internet, though, so only remap these in the no-domain/testing case).
