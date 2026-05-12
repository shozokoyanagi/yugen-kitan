import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const reset = process.argv.includes("--reset");
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

if (!databaseUrl.startsWith("file:")) {
  console.error("Only SQLite file: DATABASE_URL values are supported by this prototype.");
  process.exit(1);
}

const rawPath = databaseUrl.replace(/^file:/, "");
const dbPath = path.isAbsolute(rawPath)
  ? rawPath
  : path.resolve(process.cwd(), "prisma", rawPath);

if (reset && existsSync(dbPath)) {
  rmSync(dbPath);
}

if (existsSync(dbPath)) {
  spawnSync("sqlite3", [dbPath, "ALTER TABLE Staff ADD COLUMN lineUserId TEXT"], {
    stdio: "ignore",
  });
  spawnSync("sqlite3", [dbPath, "CREATE UNIQUE INDEX Staff_lineUserId_key ON Staff(lineUserId)"], {
    stdio: "ignore",
  });
  console.log(`SQLite database already exists: ${dbPath}`);
  process.exit(0);
}

mkdirSync(path.dirname(dbPath), { recursive: true });

const initSqlPath = path.resolve(process.cwd(), "prisma/init.sql");
const result = spawnSync("sqlite3", [dbPath], {
  input: `.read '${initSqlPath}'\n`,
  stdio: ["pipe", "inherit", "inherit"],
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`SQLite database initialized: ${dbPath}`);
