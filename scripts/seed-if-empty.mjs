import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";

const prisma = new PrismaClient();

try {
  const staffCount = await prisma.staff.count();
  if (staffCount > 0) {
    console.log(`Seed skipped: ${staffCount} staff already exist.`);
    process.exit(0);
  }
} finally {
  await prisma.$disconnect();
}

const result = spawnSync("npm", ["run", "prisma:seed"], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
