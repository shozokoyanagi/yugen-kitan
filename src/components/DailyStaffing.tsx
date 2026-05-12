import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { isoDate, jpDate } from "../lib/date";

type Daily = {
  date: Date;
  shiftCount: number;
  approvedLeaveCount: number;
  substituteCount: number;
  pendingOfferCount: number;
  currentCount: number;
  isOk: boolean;
};

export function DailyStaffing({ items }: { items: Daily[] }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">人数チェック</h2>
        <span className="text-xs text-stone-500">出勤予定 - 承認済み有給 + 代替出勤</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={isoDate(item.date)} className="rounded-md border border-stone-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{jpDate(item.date)}</span>
              {item.isOk ? (
                <CheckCircle2 className="h-4 w-4 text-leaf-700" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-coral-700" />
              )}
            </div>
            <div className="mt-2 text-2xl font-bold">{item.currentCount}人</div>
            <div className="mt-1 text-xs text-stone-500">
              基本{item.shiftCount} / 有給{item.approvedLeaveCount} / 代替{item.substituteCount}
            </div>
            {!item.isOk && <div className="mt-2 text-xs font-semibold text-coral-700">要注意</div>}
            {item.pendingOfferCount > 0 && (
              <div className="mt-1 text-xs font-semibold text-amber-800">代務候補 {item.pendingOfferCount}件</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
