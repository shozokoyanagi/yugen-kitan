import type { Staff } from "@prisma/client";
import { Upload, UserPlus } from "lucide-react";
import { createStaff, importShiftCsvAction } from "../../app/actions";

export function CurrentStaffSelector({
  staff,
  currentStaffId,
  month,
}: {
  staff: Staff[];
  currentStaffId: string;
  month: string;
}) {
  return (
    <form className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-soft">
      <input type="hidden" name="month" value={month} />
      <label htmlFor="staffId" className="text-sm font-semibold">
        操作するスタッフ
      </label>
      <select id="staffId" name="staffId" defaultValue={currentStaffId} className="rounded-md border border-stone-300 px-3 py-2">
        {staff.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name} {person.role === "ADMIN" ? "（管理者）" : ""}
          </option>
        ))}
      </select>
      <button className="rounded-md bg-stone-800 px-3 py-2 text-sm font-semibold text-white">切り替え</button>
    </form>
  );
}

export function MonthSelector({ month, staffId }: { month: string; staffId: string }) {
  return (
    <form className="flex items-center gap-2">
      <input type="hidden" name="staffId" value={staffId} />
      <input type="month" name="month" defaultValue={month} className="rounded-md border border-stone-300 px-3 py-2" />
      <button className="rounded-md bg-leaf-600 px-3 py-2 text-sm font-semibold text-white">表示</button>
    </form>
  );
}

export function StaffCreateForm() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-leaf-700" />
        <h2 className="text-lg font-bold">スタッフ追加</h2>
      </div>
      <form action={createStaff} className="grid gap-2 sm:grid-cols-2">
        <input name="name" required placeholder="名前" className="rounded-md border border-stone-300 px-3 py-2" />
        <input name="joinedAt" required type="date" className="rounded-md border border-stone-300 px-3 py-2" />
        <input
          name="paidLeaveBalance"
          required
          type="number"
          step="0.5"
          min="0"
          defaultValue="10"
          className="rounded-md border border-stone-300 px-3 py-2"
        />
        <select name="role" defaultValue="STAFF" className="rounded-md border border-stone-300 px-3 py-2">
          <option value="STAFF">スタッフ</option>
          <option value="ADMIN">管理者</option>
        </select>
        <button className="rounded-md bg-leaf-600 px-3 py-2 font-semibold text-white sm:col-span-2">追加</button>
      </form>
    </section>
  );
}

export function ShiftCsvImport() {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <Upload className="h-5 w-5 text-leaf-700" />
        <h2 className="text-lg font-bold">基本シフトCSV取り込み</h2>
      </div>
      <p className="mb-3 text-sm text-stone-600">形式: date,staffName,workCode。例: 2026-05-01,佐藤,①</p>
      <form action={importShiftCsvAction} className="space-y-2">
        <textarea
          name="csv"
          rows={7}
          className="w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
          defaultValue={"date,staffName,workCode\n2026-05-01,佐藤 花,①\n2026-05-01,田中 誠,②\n2026-05-01,鈴木 里奈,③"}
        />
        <button className="rounded-md bg-stone-800 px-3 py-2 text-sm font-semibold text-white">取り込む</button>
      </form>
    </section>
  );
}
