/**
 * Applies `prisma/migrations` over the `pg` driver instead of Prisma's schema
 * engine.
 *
 * The schema engine opens its own connection with a fixed short timeout and no
 * retries, which a high-latency link (VPN hop to the Neon region) drops often
 * enough that `migrate deploy` rarely survives a six-migration run. `pg`
 * reaches the same server reliably, so the SQL is replayed here and the
 * `_prisma_migrations` bookkeeping is written exactly as the engine would —
 * same checksum, same columns — leaving later `migrate deploy` runs on Vercel
 * a clean no-op.
 *
 * Usage: node scripts/neon-apply.mjs [--reset] [--status]
 */
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");
const RETRIES = 5;

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DIRECT_URL (or DATABASE_URL) first.");
}

/** Prisma's own DDL for the bookkeeping table, so the engine accepts it later. */
const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
  )`;

/** One connection per attempt — a dropped link leaves the client unusable. */
async function withClient(label, run) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 30_000,
      query_timeout: 120_000,
      keepAlive: true,
    });
    try {
      await client.connect();
      const result = await run(client);
      await client.end();
      return result;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});
      if (attempt < RETRIES) {
        const wait = attempt * 2000;
        console.log(`  ${label}: ${error.message} — retry ${attempt}/${RETRIES - 1} in ${wait / 1000}s`);
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }
  throw lastError;
}

async function listTables() {
  return withClient("inspect", async (client) => {
    const { rows } = await client.query(
      `select tablename from pg_tables where schemaname = 'public' order by tablename`,
    );
    return rows.map((row) => row.tablename);
  });
}

async function main() {
  const reset = process.argv.includes("--reset");
  const statusOnly = process.argv.includes("--status");

  const existing = await listTables();
  console.log(
    existing.length
      ? `Found ${existing.length} table(s): ${existing.join(", ")}`
      : "Schema is empty.",
  );
  if (statusOnly) return;

  if (reset && existing.length) {
    console.log("Dropping and recreating schema \"public\"…");
    await withClient("reset", (client) =>
      client.query(`drop schema public cascade; create schema public;`),
    );
  }

  await withClient("bookkeeping", (client) => client.query(MIGRATIONS_TABLE));

  const applied = await withClient("read applied", async (client) => {
    const { rows } = await client.query(
      `select migration_name from "_prisma_migrations" where finished_at is not null`,
    );
    return new Set(rows.map((row) => row.migration_name));
  });

  const names = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of names) {
    if (applied.has(name)) {
      console.log(`- ${name} (already applied)`);
      continue;
    }
    const raw = await readFile(path.join(MIGRATIONS_DIR, name, "migration.sql"));
    const checksum = createHash("sha256").update(raw).digest("hex");

    console.log(`+ ${name}`);
    await withClient(name, async (client) => {
      await client.query("begin");
      try {
        await client.query(raw.toString("utf8"));
        await client.query(
          `insert into "_prisma_migrations"
             (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
           values ($1, $2, $3, now(), now(), 1)`,
          [randomUUID(), checksum, name],
        );
        await client.query("commit");
      } catch (error) {
        await client.query("rollback").catch(() => {});
        throw error;
      }
    });
  }

  const tables = await listTables();
  console.log(`\nDone — ${tables.length} table(s) in public.`);
}

await main();
