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
    "山本　隆": { 7: "②", 8: "②", 9: "②", 13: "①", 14: "①", 15: "①", 19: "③", 20: "③", 21: "③", 24: "②", 26: "②", 27: "②", 30: "①", 31: "①" },
    "仁熊　祐三": { 6: "①", 7: "①", 8: "①", 12: "③", 13: "③", 14: "③", 17: "②", 19: "②", 20: "②", 23: "①", 24: "①", 26: "①", 29: "③", 30: "③", 31: "③" },
    "中川　隆一": { 5: "③", 6: "③", 7: "③", 10: "②", 12: "②", 13: "②", 16: "①", 17: "①", 19: "①", 22: "③", 23: "③", 24: "③", 28: "②", 29: "②", 30: "②" },
    "小柳　省三": { 5: "②", 6: "②", 9: "①", 10: "①", 12: "①", 15: "③", 16: "③", 17: "③", 21: "②", 22: "②", 23: "②", 27: "①", 28: "①", 29: "①" },
    "蟹江　直樹": { 5: "①", 8: "③", 9: "③", 10: "③", 14: "②", 15: "②", 16: "②", 20: "①", 21: "①", 22: "①", 26: "③", 27: "③", 28: "③", 31: "②" },
  },
  "2026-02": {
    "山本　隆": { 2: "①", 5: "③", 6: "③", 7: "③", 11: "②", 12: "②", 13: "②", 17: "①", 18: "①", 19: "①", 23: "③", 24: "③", 25: "③", 28: "②" },
    "仁熊　祐三": { 4: "②", 5: "②", 6: "②", 10: "①", 11: "①", 12: "①", 16: "③", 17: "③", 18: "③", 21: "②", 23: "②", 24: "②", 27: "①", 28: "①" },
    "中川　隆一": { 3: "①", 4: "①", 5: "①", 9: "③", 10: "③", 11: "③", 14: "②", 16: "②", 17: "②", 20: "①", 21: "①", 23: "①", 26: "③", 27: "③", 28: "③" },
    "小柳　省三": { 2: "③", 3: "③", 4: "③", 7: "②", 9: "②", 10: "②", 13: "①", 14: "①", 16: "①", 19: "③", 20: "③", 21: "③", 25: "②", 26: "②", 27: "②" },
    "蟹江　直樹": { 2: "②", 3: "②", 6: "①", 7: "①", 9: "①", 12: "③", 13: "③", 14: "③", 18: "②", 19: "②", 20: "②", 24: "①", 25: "①", 26: "①" },
  },
  "2026-03": {
    "山本　隆": { 2: "②", 3: "②", 6: "①", 7: "①", 9: "①", 12: "③", 13: "③", 14: "③", 18: "②", 19: "②", 20: "②", 24: "①", 25: "①", 26: "①", 30: "③", 31: "③" },
    "仁熊　祐三": { 2: "①", 5: "③", 6: "③", 7: "③", 11: "②", 12: "②", 13: "②", 17: "①", 18: "①", 19: "①", 23: "③", 24: "③", 25: "③", 28: "②", 30: "②", 31: "②" },
    "中川　隆一": { 4: "②", 5: "②", 6: "②", 10: "①", 11: "①", 12: "①", 16: "③", 17: "③", 18: "③", 21: "②", 23: "②", 24: "②", 27: "①", 28: "①", 30: "①" },
    "小柳　省三": { 3: "①", 4: "①", 5: "①", 9: "③", 10: "③", 11: "③", 14: "②", 16: "②", 17: "②", 20: "①", 21: "①", 23: "①", 26: "③", 27: "③", 28: "③" },
    "蟹江　直樹": { 2: "③", 3: "③", 4: "③", 7: "②", 9: "②", 10: "②", 13: "①", 14: "①", 16: "①", 19: "③", 20: "③", 21: "③", 25: "②", 26: "②", 27: "②", 31: "①" },
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
