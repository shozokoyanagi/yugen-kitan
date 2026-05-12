import Link from "next/link";
import { ArrowLeft, Check, CircleAlert, X } from "lucide-react";
import { decideSubstituteOffer, markConsultation, updateLeaveStatus } from "../actions";
import { OfferBadge, StatusBadge } from "../../src/components/status";
import { currentMonth, daysInMonth, isoDate, jpDate, monthLabel } from "../../src/lib/date";
import { prisma } from "../../src/lib/prisma";

export default async function AdminPage({ searchParams }: { searchParams: { month?: string } }) {
  const month = searchParams.month ?? currentMonth();
  const days = daysInMonth(month);
  const monthStart = days[0];
  const monthEnd = days[days.length - 1];

  const [leaves, offers, staff, histories] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      include: { staff: true, substituteOffers: { include: { staff: true } } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.substituteOffer.findMany({
      where: { leaveRequest: { date: { gte: monthStart, lte: monthEnd } } },
      include: { staff: true, leaveRequest: { include: { staff: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
    prisma.staff.findMany({ orderBy: { name: "asc" } }),
    prisma.paidLeaveHistory.findMany({
      include: { staff: true, leaveRequest: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const consultation = leaves.filter((leave) => leave.status === "CONSULTATION" || leave.status === "SEEKING_SUBSTITUTE");

  return (
    <main className="mx-auto max-w-6xl px-3 py-5 sm:px-5 lg:px-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">管理者画面</h1>
          <p className="mt-1 text-sm text-stone-600">{monthLabel(month)} の申請と残日数</p>
        </div>
        <Link href={`/?month=${month}`} className="inline-flex items-center gap-2 rounded-md bg-stone-800 px-3 py-2 text-sm font-semibold text-white">
          <ArrowLeft className="h-4 w-4" />
          シフト表へ
        </Link>
      </header>

      <div className="space-y-5">
        <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-coral-700" />
            <h2 className="text-lg font-bold">要相談・代替者募集中</h2>
          </div>
          {consultation.length === 0 ? (
            <p className="text-sm text-stone-500">現在ありません。</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {consultation.map((leave) => (
                <div key={leave.id} className="rounded-md border border-coral-100 bg-coral-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {jpDate(leave.date)} {leave.staff.name}
                    </span>
                    <StatusBadge status={leave.status} />
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{leave.memo || "メモなし"}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
          <h2 className="mb-3 text-lg font-bold">有給申請一覧</h2>
          <div className="space-y-2">
            {leaves.map((leave) => (
              <div key={leave.id} className="grid gap-3 rounded-md border border-stone-200 p-3 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {jpDate(leave.date)} {leave.staff.name}
                    </span>
                    <StatusBadge status={leave.status} />
                    <span className="text-xs text-stone-500">{leave.type === "HALF" ? "半日" : "全日"}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{leave.memo || "メモなし"}</p>
                  {leave.substituteOffers.length > 0 && (
                    <p className="mt-1 text-xs text-amber-800">代務候補: {leave.substituteOffers.map((offer) => offer.staff.name).join("、")}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={updateLeaveStatus}>
                    <input type="hidden" name="id" value={leave.id} />
                    <input type="hidden" name="month" value={month} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button className="inline-flex items-center gap-1 rounded-md bg-leaf-600 px-3 py-2 text-sm font-semibold text-white">
                      <Check className="h-4 w-4" />
                      承認
                    </button>
                  </form>
                  <form action={markConsultation}>
                    <input type="hidden" name="id" value={leave.id} />
                    <input type="hidden" name="month" value={month} />
                    <button className="rounded-md bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">要相談</button>
                  </form>
                  <form action={updateLeaveStatus}>
                    <input type="hidden" name="id" value={leave.id} />
                    <input type="hidden" name="month" value={month} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button className="inline-flex items-center gap-1 rounded-md bg-stone-200 px-3 py-2 text-sm font-semibold text-stone-700">
                      <X className="h-4 w-4" />
                      却下
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
          <h2 className="mb-3 text-lg font-bold">代替出勤申請一覧</h2>
          <div className="space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="grid gap-3 rounded-md border border-stone-200 p-3 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {jpDate(offer.leaveRequest.date)} {offer.staff.name} → {offer.leaveRequest.staff.name}さんの代務
                    </span>
                    <OfferBadge status={offer.status} />
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{offer.message || "メッセージなし"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={decideSubstituteOffer}>
                    <input type="hidden" name="id" value={offer.id} />
                    <input type="hidden" name="month" value={month} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button className="rounded-md bg-leaf-600 px-3 py-2 text-sm font-semibold text-white">承認</button>
                  </form>
                  <form action={decideSubstituteOffer}>
                    <input type="hidden" name="id" value={offer.id} />
                    <input type="hidden" name="month" value={month} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button className="rounded-md bg-stone-200 px-3 py-2 text-sm font-semibold text-stone-700">見送り</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
            <h2 className="mb-3 text-lg font-bold">スタッフ別 有給残日数</h2>
            <div className="space-y-2">
              {staff.map((person) => (
                <div key={person.id} className="flex items-center justify-between rounded-md border border-stone-200 p-3">
                  <span className="font-semibold">{person.name}</span>
                  <span className="text-xl font-bold text-leaf-700">{person.paidLeaveBalance}日</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
            <h2 className="mb-3 text-lg font-bold">有給取得履歴</h2>
            <div className="space-y-2">
              {histories.map((history) => (
                <div key={history.id} className="rounded-md border border-stone-200 p-3 text-sm">
                  <div className="font-semibold">
                    {history.staff.name} {Math.abs(history.amount)}日
                  </div>
                  <div className="text-stone-500">
                    {isoDate(history.leaveRequest.date)} / {history.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
