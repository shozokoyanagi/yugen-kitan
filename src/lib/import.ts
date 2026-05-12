import { prisma } from "./prisma";
import { toDateOnly } from "./date";

export type ShiftImportRow = {
  date: string;
  staffName: string;
  workCode: string;
};

export function parseShiftCsv(csv: string): ShiftImportRow[] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [date, staffName, workCode] = line.split(",").map((part) => part.trim());
      if (index === 0 && date === "date") return null;
      if (!date || !staffName || !workCode) {
        throw new Error(`${index + 1}行目の形式を確認してください`);
      }
      return { date, staffName, workCode };
    })
    .filter((row): row is ShiftImportRow => Boolean(row));
}

export async function importShiftRows(rows: ShiftImportRow[]) {
  let count = 0;

  for (const row of rows) {
    const staff = await prisma.staff.findFirst({ where: { name: row.staffName } });
    if (!staff) {
      throw new Error(`${row.staffName} さんがスタッフに登録されていません`);
    }

    await prisma.shift.upsert({
      where: {
        date_staffId: {
          date: toDateOnly(row.date),
          staffId: staff.id,
        },
      },
      create: {
        date: toDateOnly(row.date),
        staffId: staff.id,
        workCode: row.workCode,
        source: "csv",
      },
      update: {
        workCode: row.workCode,
        source: "csv",
      },
    });
    count += 1;
  }

  return count;
}
