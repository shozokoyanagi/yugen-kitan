import type { LeaveRequest, Shift, Staff, SubstituteOffer } from "@prisma/client";
import clsx from "clsx";
import { CalendarDays, HandHeart, Plus, Trash2 } from "lucide-react";
import { createLeaveRequest, createShift, createSubstituteOffer, removeShift } from "../../app/actions";
import { isoDate, jpDate } from "../lib/date";
import { StatusBadge } from "./status";

type LeaveWithOffers = LeaveRequest & {
  staff: Staff;
  substituteOffers: (SubstituteOffer & { staff: Staff })[];
};

type ShiftBoardProps = {
  month: string;
  days: Date[];
  staff: Staff[];
  shifts: Shift[];
  leaves: LeaveWithOffers[];
  currentStaffId: string;
  isAdmin: boolean;
};

export function ShiftBoard({
  month,
  days,
  staff,
  shifts,
  leaves,
  currentStaffId,
  isAdmin,
}: ShiftBoardProps) {
  const shiftMap = new Map(shifts.map((shift) => [`${isoDate(shift.date)}:${shift.staffId}`, shift]));
  const leavesByCell = new Map<string, LeaveWithOffers[]>();
  for (const leave of leaves) {
    const key = `${isoDate(leave.date)}:${leave.staffId}`;
    leavesByCell.set(key, [...(leavesByCell.get(key) ?? []), leave]);
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-leaf-700" />
          <h2 className="text-lg font-bold">基本シフト表</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-leaf-100 px-2 py-1 text-leaf-700">代務</span>
          <span className="rounded-full bg-coral-50 px-2 py-1 text-coral-700">代替者募集中</span>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">代務候補あり</span>
        </div>
      </div>

      <div className="table-scroll overflow-x-auto">
        <table className="min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-stone-50">
              <th className="sticky left-0 z-10 w-32 border-b border-r border-stone-200 bg-stone-50 px-3 py-2 text-left">
                スタッフ
              </th>
              {days.map((day) => (
                <th key={isoDate(day)} className="w-24 border-b border-r border-stone-200 px-2 py-2 text-center">
                  {jpDate(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((person) => (
              <tr key={person.id}>
                <th className="sticky left-0 z-10 border-b border-r border-stone-200 bg-white px-3 py-2 text-left font-semibold">
                  {person.name}
                </th>
                {days.map((day) => {
                  const date = isoDate(day);
                  const shift = shiftMap.get(`${date}:${person.id}`);
                  const cellLeaves = leavesByCell.get(`${date}:${person.id}`) ?? [];
                  const activeLeave = cellLeaves.find((leave) => leave.status !== "REJECTED");
                  const seeking = activeLeave?.status === "SEEKING_SUBSTITUTE";
                  const hasOffer = activeLeave?.substituteOffers.some((offer) => offer.status === "PENDING");
                  const canRequestLeave = person.id === currentStaffId && shift && !activeLeave;
                  const canOffer =
                    activeLeave &&
                    activeLeave.staffId !== currentStaffId &&
                    !shiftMap.get(`${date}:${currentStaffId}`) &&
                    activeLeave.status !== "APPROVED" &&
                    activeLeave.status !== "REJECTED";

                  return (
                    <td
                      key={`${person.id}-${date}`}
                      className={clsx(
                        "h-32 w-24 border-b border-r border-stone-200 p-1 align-top",
                        seeking && "bg-coral-50",
                        activeLeave?.status === "APPROVED" && "bg-leaf-50",
                        hasOffer && "bg-amber-50",
                      )}
                    >
                      <div className="flex h-full flex-col gap-1">
                        <div className="flex min-h-7 items-center justify-center">
                          {shift ? (
                            <span
                              className={clsx(
                                "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold",
                                shift.isSubstitute ? "bg-leaf-100 text-leaf-700" : "bg-stone-100 text-stone-700",
                              )}
                              title={shift.isSubstitute ? "承認済みの代替出勤" : "基本シフト"}
                            >
                              {shift.workCode}
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400">休</span>
                          )}
                        </div>

                        {activeLeave && (
                          <div className="space-y-1 text-center">
                            <StatusBadge status={activeLeave.status} />
                            {hasOffer && <div className="text-[11px] font-semibold text-amber-800">代務候補あり</div>}
                          </div>
                        )}

                        {canRequestLeave && (
                          <form action={createLeaveRequest} className="mt-auto space-y-1">
                            <input type="hidden" name="staffId" value={person.id} />
                            <input type="hidden" name="date" value={date} />
                            <input type="hidden" name="month" value={month} />
                            <select name="type" className="w-full rounded border border-stone-200 bg-white px-1 py-1 text-xs">
                              <option value="FULL">全日</option>
                              <option value="HALF">半日</option>
                            </select>
                            <input
                              name="memo"
                              className="w-full rounded border border-stone-200 px-1 py-1 text-xs"
                              placeholder="メモ"
                            />
                            <button className="inline-flex w-full items-center justify-center gap-1 rounded bg-leaf-600 px-2 py-1 text-xs font-semibold text-white">
                              <HandHeart className="h-3.5 w-3.5" />
                              有給申請
                            </button>
                          </form>
                        )}

                        {canOffer && (
                          <form action={createSubstituteOffer} className="mt-auto space-y-1">
                            <input type="hidden" name="leaveRequestId" value={activeLeave.id} />
                            <input type="hidden" name="staffId" value={currentStaffId} />
                            <input type="hidden" name="month" value={month} />
                            <input
                              name="message"
                              className="w-full rounded border border-stone-200 px-1 py-1 text-xs"
                              placeholder="一言"
                            />
                            <button className="inline-flex w-full items-center justify-center gap-1 rounded bg-coral-500 px-2 py-1 text-xs font-semibold text-white">
                              <Plus className="h-3.5 w-3.5" />
                              入れます
                            </button>
                          </form>
                        )}

                        {isAdmin && (
                          <div className="mt-auto flex gap-1">
                            {!shift && (
                              <form action={createShift} className="flex min-w-0 flex-1 gap-1">
                                <input type="hidden" name="staffId" value={person.id} />
                                <input type="hidden" name="date" value={date} />
                                <input type="hidden" name="month" value={month} />
                                <select name="workCode" className="min-w-0 flex-1 rounded border border-stone-200 text-xs">
                                  <option>1</option>
                                  <option>2</option>
                                  <option>3</option>
                                </select>
                                <button className="rounded bg-stone-800 p-1 text-white" title="シフト追加">
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </form>
                            )}
                            {shift && !shift.isSubstitute && (
                              <form action={removeShift}>
                                <input type="hidden" name="staffId" value={person.id} />
                                <input type="hidden" name="date" value={date} />
                                <input type="hidden" name="month" value={month} />
                                <button className="rounded bg-stone-100 p-1 text-stone-600" title="基本シフト削除">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
