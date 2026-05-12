import type { LeaveRequest, Staff, SubstituteOffer } from "@prisma/client";
import { isoDate, jpDate } from "@/lib/date";
import { StatusBadge } from "@/components/status";

type LeaveWithOffers = LeaveRequest & {
  staff: Staff;
  substituteOffers: (SubstituteOffer & { staff: Staff })[];
};

export function LeaveCalendar({ days, leaves }: { days: Date[]; leaves: LeaveWithOffers[] }) {
  const byDate = new Map<string, LeaveWithOffers[]>();
  for (const leave of leaves) {
    const key = isoDate(leave.date);
    byDate.set(key, [...(byDate.get(key) ?? []), leave]);
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <h2 className="mb-3 text-lg font-bold">休み予定カレンダー</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const items = byDate.get(isoDate(day)) ?? [];
          return (
            <div key={isoDate(day)} className="min-h-28 rounded-md border border-stone-200 bg-stone-50 p-2">
              <div className="mb-2 text-xs font-semibold text-stone-600">{jpDate(day)}</div>
              <div className="space-y-1">
                {items.length === 0 && <div className="text-xs text-stone-400">申請なし</div>}
                {items.map((leave) => (
                  <div key={leave.id} className="rounded bg-white p-2 text-xs">
                    <div className="font-semibold">{leave.staff.name}</div>
                    <div className="mt-1">
                      <StatusBadge status={leave.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
