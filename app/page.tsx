import { LiffBridge } from "../src/components/LiffBridge";
import { PaperShiftTable } from "../src/components/PaperShiftTable";
import { daysInMonth } from "../src/lib/date";
import { prisma } from "../src/lib/prisma";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { month?: string; staffId?: string; lineUserId?: string };
}) {
  const month = searchParams.month ?? "2026-03";
  const days = daysInMonth(month);
  const staff = await prisma.staff.findMany({ orderBy: { createdAt: "asc" } });
  const lineStaff = searchParams.lineUserId
    ? staff.find((person) => person.lineUserId === searchParams.lineUserId)
    : undefined;
  const currentStaff = lineStaff ?? staff.find((person) => person.id === searchParams.staffId) ?? staff[0];
  const monthStart = days[0];
  const monthEnd = days[days.length - 1];

  const [shifts, leaves] = await Promise.all([
    prisma.shift.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      orderBy: [{ date: "asc" }, { staff: { name: "asc" } }],
    }),
    prisma.leaveRequest.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      include: {
        staff: true,
        substituteOffers: { include: { staff: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (staff.length === 0 || !currentStaff) {
    return <main className="p-3 text-sm">データがありません。</main>;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="flex items-center gap-2 border-b border-black bg-white p-2 text-xs">
        <form className="flex min-w-0 flex-1 items-center gap-1">
          {searchParams.lineUserId && <input type="hidden" name="lineUserId" value={searchParams.lineUserId} />}
          <input type="month" name="month" defaultValue={month} className="w-32 border border-black px-1 py-1" />
          <select name="staffId" defaultValue={currentStaff.id} className="min-w-0 flex-1 border border-black px-1 py-1">
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}{person.role === "ADMIN" ? " 管理" : ""}
              </option>
            ))}
          </select>
          <button className="border border-black bg-yellow-200 px-2 py-1 font-bold">表示</button>
        </form>
      </div>

      <LiffBridge
        staff={staff}
        currentStaffId={lineStaff?.id}
        lineUserId={searchParams.lineUserId}
        month={month}
      />

      <PaperShiftTable
        month={month}
        days={days}
        staff={staff}
        shifts={shifts}
        leaves={leaves}
        currentStaffId={currentStaff.id}
        isAdmin={currentStaff.role === "ADMIN"}
      />
    </main>
  );
}
