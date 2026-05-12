import Link from "next/link";
import { Suspense } from "react";
import { Home, ShieldCheck } from "lucide-react";
import { CurrentStaffSelector, MonthSelector, ShiftCsvImport, StaffCreateForm } from "@/components/QuickForms";
import { DailyStaffing } from "@/components/DailyStaffing";
import { LeaveCalendar } from "@/components/LeaveCalendar";
import { ShiftBoard } from "@/components/ShiftBoard";
import { currentMonth, daysInMonth, isoDate, monthLabel } from "@/lib/date";
import { dailyStaffing } from "@/lib/leaveRules";
import { prisma } from "@/lib/prisma";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { month?: string; staffId?: string };
}) {
  const month = searchParams.month ?? currentMonth();
  const days = daysInMonth(month);
  const staff = await prisma.staff.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  const currentStaff = staff.find((person) => person.id === searchParams.staffId) ?? staff[0];
  const monthStart = days[0];
  const monthEnd = days[days.length - 1];

  const [shifts, leaves, staffing] = await Promise.all([
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
    Promise.all(days.map((day) => dailyStaffing(day))),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-5 lg:px-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-leaf-100 px-3 py-1 text-sm font-semibold text-leaf-700">
            <Home className="h-4 w-4" />
            小規模職場向け
          </div>
          <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">みんなの有給シフト</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            「休みたい」と「代わりに入れる」を同じシフト表で見える化します。却下から入らず、まず調整できる余地を探すためのプロトタイプです。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MonthSelector month={month} staffId={currentStaff?.id ?? ""} />
          <Link
            href={`/admin?month=${month}`}
            className="inline-flex items-center gap-2 rounded-md bg-stone-800 px-3 py-2 text-sm font-semibold text-white"
          >
            <ShieldCheck className="h-4 w-4" />
            管理者画面
          </Link>
        </div>
      </header>

      {staff.length === 0 || !currentStaff ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          データがありません。READMEの手順で `npm run prisma:migrate` と `npm run prisma:seed` を実行してください。
        </div>
      ) : (
        <div className="space-y-5">
          <CurrentStaffSelector staff={staff} currentStaffId={currentStaff.id} month={month} />

          <Suspense>
            <DailyStaffing items={staffing.filter((item) => item.shiftCount > 0 || item.approvedLeaveCount > 0).slice(0, 12)} />
          </Suspense>

          <ShiftBoard
            month={month}
            days={days}
            staff={staff}
            shifts={shifts}
            leaves={leaves}
            currentStaffId={currentStaff.id}
            isAdmin={currentStaff.role === "ADMIN"}
          />

          <LeaveCalendar days={days} leaves={leaves} />

          <div className="grid gap-5 lg:grid-cols-2">
            <ShiftCsvImport />
            <StaffCreateForm />
          </div>

          <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
            <h2 className="mb-3 text-lg font-bold">スタッフ別 有給残日数</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {staff.map((person) => (
                <div key={person.id} className="rounded-md border border-stone-200 p-3">
                  <div className="font-semibold">{person.name}</div>
                  <div className="text-2xl font-bold text-leaf-700">{person.paidLeaveBalance}</div>
                  <div className="text-xs text-stone-500">残日数</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
