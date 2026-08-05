/**
 * Starts/stops the project-local PostgreSQL cluster in `.pgdata`.
 *
 * This exists because the machine's shared PostgreSQL servers are password
 * protected and belong to other projects. The bundled cluster listens on 5544
 * and is disposable: delete `.pgdata`, re-run `npm run db:init`, and you are
 * back to a clean database.
 *
 * If you would rather use your own server, point DATABASE_URL at it and ignore
 * these scripts entirely.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, ".pgdata");
const PORT = process.env.PGPORT ?? "5544";

/** Finds pg_ctl from PGBIN, PATH, or a standard Windows install. */
function findBin(name) {
  if (process.env.PGBIN) return join(process.env.PGBIN, name);

  const windowsRoot = "C:/Program Files/PostgreSQL";
  if (existsSync(windowsRoot)) {
    const versions = readdirSync(windowsRoot)
      .filter((entry) => /^\d+$/.test(entry))
      .sort((a, b) => Number(b) - Number(a));
    for (const version of versions) {
      const candidate = join(windowsRoot, version, "bin", `${name}.exe`);
      if (existsSync(candidate)) return candidate;
    }
  }

  return name; // fall back to PATH
}

const action = process.argv[2];
const pgCtl = findBin("pg_ctl");

if (!existsSync(DATA) && action !== "init") {
  console.error(
    `No cluster at ${DATA}.\nRun: npm run db:init  (creates it), then npm run db:start`,
  );
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  return result.status ?? 0;
}

switch (action) {
  case "init": {
    if (existsSync(DATA)) {
      console.log(`${DATA} already exists — nothing to do.`);
      break;
    }
    const password = process.env.PGPASSWORD;
    if (!password) {
      console.error(
        "Set PGPASSWORD to the superuser password you want, then re-run.",
      );
      process.exit(1);
    }
    const initdb = findBin("initdb");
    run(initdb, [
      "-D",
      DATA,
      "-U",
      "postgres",
      "--auth-host=scram-sha-256",
      "--auth-local=scram-sha-256",
      "-E",
      "UTF8",
      "--locale=C",
      "--pwfile=/dev/stdin",
    ], { input: password });
    console.log(`Created ${DATA}. Now: npm run db:start`);
    break;
  }

  case "start": {
    const status = run(pgCtl, [
      "-D",
      DATA,
      "-o",
      `-p ${PORT}`,
      "-l",
      join(DATA, "server.log"),
      "-w",
      "start",
    ]);
    process.exit(status);
  }

  case "stop": {
    const status = run(pgCtl, ["-D", DATA, "-m", "fast", "stop"]);
    process.exit(status);
  }

  case "status": {
    const status = run(pgCtl, ["-D", DATA, "status"]);
    process.exit(status);
  }

  default:
    console.error("Usage: node scripts/pg.mjs <init|start|stop|status>");
    process.exit(1);
}
