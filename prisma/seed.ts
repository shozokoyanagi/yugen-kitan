import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function day(value: string) {
  return new Date(`${value}T00:00:00`);
}

const staff = [
  { name: "山本　隆", joinedAt: "2022-04-01", paidLeaveBalance: 12, role: "ADMIN" },
  { name: "仁熊　祐三", joinedAt: "2023-01-10", paidLeaveBalance: 10, role: "STAFF" },
  { name: "中川　隆一", joinedAt: "2021-09-15", paidLeaveBalance: 14, role: "STAFF" },
  { name: "小柳　省三", joinedAt: "2024-05-01", paidLeaveBalance: 8, role: "STAFF" },
  { name: "蟹江　直樹", joinedAt: "2022-11-20", paidLeaveBalance: 11, role: "STAFF" },
];

const patterns: Record<string, Record<string, Record<number, string>>> = {
  "2026-01": {
    "山本　隆": { 7: "2", 8: "2", 9: "2", 13: "1", 14: "1", 15: "1", 19: "3", 20: "3", 21: "3", 24: "2", 26: "2", 27: "2", 30: "1", 31: "1" },
    "仁熊　祐三": { 6: "1", 7: "1", 8: "1", 12: "3", 13: "3", 14: "3", 17: "2", 19: "2", 20: "2", 23: "1", 24: "1", 26: "1", 29: "3", 30: "3", 31: "3" },
    "中川　隆一": { 5: "3", 6: "3", 7: "3", 10: "2", 12: "2", 13: "2", 16: "1", 17: "1", 19: "1", 22: "3", 23: "3", 24: "3", 28: "2", 29: "2", 30: "2" },
    "小柳　省三": { 5: "2", 6: "2", 9: "1", 10: "1", 12: "1", 15: "3", 16: "3", 17: "3", 21: "2", 22: "2", 23: "2", 27: "1", 28: "1", 29: "1" },
    "蟹江　直樹": { 5: "1", 8: "3", 9: "3", 10: "3", 14: "2", 15: "2", 16: "2", 20: "1", 21: "1", 22: "1", 26: "3", 27: "3", 28: "3", 31: "2" },
  },
  "2026-02": {
    "山本　隆": { 2: "1", 5: "3", 6: "3", 7: "3", 11: "2", 12: "2", 13: "2", 17: "1", 18: "1", 19: "1", 23: "3", 24: "3", 25: "3", 28: "2" },
    "仁熊　祐三": { 4: "2", 5: "2", 6: "2", 10: "1", 11: "1", 12: "1", 16: "3", 17: "3", 18: "3", 21: "2", 23: "2", 24: "2", 27: "1", 28: "1" },
    "中川　隆一": { 3: "1", 4: "1", 5: "1", 9: "3", 10: "3", 11: "3", 14: "2", 16: "2", 17: "2", 20: "1", 21: "1", 23: "1", 26: "3", 27: "3", 28: "3" },
    "小柳　省三": { 2: "3", 3: "3", 4: "3", 7: "2", 9: "2", 10: "2", 13: "1", 14: "1", 16: "1", 19: "3", 20: "3", 21: "3", 25: "2", 26: "2", 27: "2" },
    "蟹江　直樹": { 2: "2", 3: "2", 6: "1", 7: "1", 9: "1", 12: "3", 13: "3", 14: "3", 18: "2", 19: "2", 20: "2", 24: "1", 25: "1", 26: "1" },
  },
  "2026-03": {
    "山本　隆": { 2: "2", 3: "2", 6: "1", 7: "1", 9: "1", 12: "3", 13: "3", 14: "3", 18: "2", 19: "2", 20: "2", 24: "1", 25: "1", 26: "1", 30: "3", 31: "3" },
    "仁熊　祐三": { 2: "1", 5: "3", 6: "3", 7: "3", 11: "2", 12: "2", 13: "2", 17: "1", 18: "1", 19: "1", 23: "3", 24: "3", 25: "3", 28: "2", 30: "2", 31: "2" },
    "中川　隆一": { 4: "2", 5: "2", 6: "2", 10: "1", 11: "1", 12: "1", 16: "3", 17: "3", 18: "3", 21: "2", 23: "2", 24: "2", 27: "1", 28: "1", 30: "1" },
    "小柳　省三": { 3: "1", 4: "1", 5: "1", 9: "3", 10: "3", 11: "3", 14: "2", 16: "2", 17: "2", 20: "1", 21: "1", 23: "1", 26: "3", 27: "3", 28: "3" },
    "蟹江　直樹": { 2: "3", 3: "3", 4: "3", 7: "2", 9: "2", 10: "2", 13: "1", 14: "1", 16: "1", 19: "3", 20: "3", 21: "3", 25: "2", 26: "2", 27: "2", 31: "1" },
  },
};

async function main() {
  await prisma.paidLeaveHistory.deleteMany();
  await prisma.substituteOffer.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.staff.deleteMany();

  const createdStaff = new Map<string, string>();
  for (const person of staff) {
    const created = await prisma.staff.create({
      data: {
        ...person,
        joinedAt: day(person.joinedAt),
      },
    });
    createdStaff.set(created.name, created.id);
  }

  for (const [month, monthPattern] of Object.entries(patterns)) {
    for (const [staffName, dates] of Object.entries(monthPattern)) {
      const staffId = createdStaff.get(staffName);
      if (!staffId) continue;
      for (const [dateNumber, workCode] of Object.entries(dates)) {
        await prisma.shift.create({
          data: {
            date: day(`${month}-${dateNumber.padStart(2, "0")}`),
            staffId,
            workCode,
            source: "pdf-sample",
          },
        });
      }
    }
  }

  const yamamoto = createdStaff.get("山本　隆")!;
  const koyanagi = createdStaff.get("小柳　省三")!;
  const sampleLeave = await prisma.leaveRequest.create({
    data: {
      staffId: yamamoto,
      date: day("2026-03-20"),
      type: "FULL",
      memo: "",
      status: "SEEKING_SUBSTITUTE",
    },
  });

  await prisma.substituteOffer.create({
    data: {
      leaveRequestId: sampleLeave.id,
      staffId: koyanagi,
      message: "",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
