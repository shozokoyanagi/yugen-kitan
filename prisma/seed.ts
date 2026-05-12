import { PrismaClient } from "@prisma/client";
import type { LeaveType } from "../src/types/domain";

const prisma = new PrismaClient();

function day(value: string) {
  return new Date(`${value}T00:00:00`);
}

const staff = [
  { name: "佐藤 花", joinedAt: "2022-04-01", paidLeaveBalance: 12, role: "ADMIN" as const },
  { name: "田中 誠", joinedAt: "2023-01-10", paidLeaveBalance: 10, role: "STAFF" as const },
  { name: "鈴木 里奈", joinedAt: "2021-09-15", paidLeaveBalance: 14, role: "STAFF" as const },
  { name: "高橋 悠", joinedAt: "2024-05-01", paidLeaveBalance: 8, role: "STAFF" as const },
  { name: "伊藤 葵", joinedAt: "2022-11-20", paidLeaveBalance: 11, role: "STAFF" as const },
];

async function main() {
  await prisma.paidLeaveHistory.deleteMany();
  await prisma.substituteOffer.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.staff.deleteMany();

  const createdStaff = await Promise.all(
    staff.map((person) =>
      prisma.staff.create({
        data: {
          ...person,
          joinedAt: day(person.joinedAt),
        },
      }),
    ),
  );

  const month = "2026-05";
  const workCodes = ["①", "②", "③"];
  for (let dateNumber = 1; dateNumber <= 31; dateNumber += 1) {
    const date = day(`${month}-${String(dateNumber).padStart(2, "0")}`);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue;

    const workers = dayOfWeek === 6 ? createdStaff.slice(0, 3) : createdStaff.slice(0, 4);
    await Promise.all(
      workers.map((person, index) =>
        prisma.shift.create({
          data: {
            date,
            staffId: person.id,
            workCode: workCodes[index % workCodes.length],
            source: "seed",
          },
        }),
      ),
    );
  }

  const sampleLeave = await prisma.leaveRequest.create({
    data: {
      staffId: createdStaff[1].id,
      date: day("2026-05-09"),
      type: "FULL" satisfies LeaveType,
      memo: "家族の予定があります",
      status: "SEEKING_SUBSTITUTE",
    },
  });

  await prisma.substituteOffer.create({
    data: {
      leaveRequestId: sampleLeave.id,
      staffId: createdStaff[4].id,
      message: "午前から入れます",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      staffId: createdStaff[2].id,
      date: day("2026-05-14"),
      type: "HALF",
      memo: "通院のため半日希望",
      status: "APPROVABLE",
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
