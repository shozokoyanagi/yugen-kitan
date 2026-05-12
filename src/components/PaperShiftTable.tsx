import type { LeaveRequest, Shift, Staff, SubstituteOffer } from "@prisma/client";
import clsx from "clsx";
import { approveLeaveFromCell, createLeaveRequest, createSubstituteOffer, rejectLeaveFromCell } from "../../app/actions";
import { isoDate } from "../lib/date";

type LeaveWithOffers = LeaveRequest & {
  staff: Staff;
  substituteOffers: (SubstituteOffer & { staff: Staff })[];
};

type PaperShiftTableProps = {
  month: string;
  days: Date[];
  staff: Staff[];
  shifts: Shift[];
  leaves: LeaveWithOffers[];
  currentStaffId: string;
  isAdmin: boolean;
  interactionsDisabled?: boolean;
};

const holidayDates = new Set([
  "2026-01-01",
  "2026-01-02",
  "2026-01-03",
  "2026-01-12",
  "2026-02-11",
  "2026-02-23",
  "2026-03-20",
  "2026-04-29",
  "2026-05-03",
  "2026-05-04",
  "2026-05-05",
  "2026-05-06",
]);

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function isYellowDay(day: Date) {
  return day.getDay() === 0 || holidayDates.has(isoDate(day));
}

function cellLabel(shift?: Shift, leave?: LeaveWithOffers) {
  if (!shift && !leave) return "";
  if (leave?.status === "APPROVED") return "有給";
  if (leave?.status === "CONSULTATION") return "要相談";
  if (leave?.substituteOffers.some((offer) => offer.status === "PENDING")) return "候補あり";
  if (leave?.status === "SEEKING_SUBSTITUTE") return "代替募集中";
  if (leave && leave.status !== "REJECTED") return "有給申請中";
  return normalizeWorkCode(shift?.workCode ?? "");
}

function normalizeWorkCode(workCode: string) {
  return workCode.replaceAll("①", "1").replaceAll("②", "2").replaceAll("③", "3");
}

export function PaperShiftTable({
  month,
  days,
  staff,
  shifts,
  leaves,
  currentStaffId,
  isAdmin,
  interactionsDisabled = false,
}: PaperShiftTableProps) {
  const shiftMap = new Map(shifts.map((shift) => [`${isoDate(shift.date)}:${shift.staffId}`, shift]));
  const leaveMap = new Map<string, LeaveWithOffers>();
  for (const leave of leaves) {
    if (leave.status !== "REJECTED") {
      leaveMap.set(`${isoDate(leave.date)}:${leave.staffId}`, leave);
    }
  }

  const requiredCount = new Map<string, number>();
  for (const person of staff) {
    requiredCount.set(
      person.id,
      shifts.filter((shift) => shift.staffId === person.id && !shift.isSubstitute).length,
    );
  }

  return (
    <div className="bg-white px-2 py-2 text-black">
      <div className="mb-2 grid grid-cols-[1fr_auto] items-start gap-2 px-1">
        <div className="text-[15px] font-black leading-tight">
          <div>基本ローテーション表</div>
          <div>{month.slice(0, 4)}年</div>
          <div>{Number(month.slice(5, 7))}月</div>
        </div>
        <div className="text-right text-[17px] font-black">今池腎クリニック</div>
      </div>

      <div className="mb-2 flex items-center gap-3 px-1 text-xs font-bold">
        <span className="inline-flex items-center gap-1"><span className="h-4 w-6 bg-gray-300" />代走</span>
        <span className="inline-flex items-center gap-1"><span className="h-4 w-6 bg-fuchsia-300" />可能日</span>
        <span className="inline-flex items-center gap-1"><span className="h-4 w-6 bg-black" />不可日</span>
        <span className="inline-flex items-center gap-1"><span className="h-4 w-8 border-2 border-red-500" />変更</span>
      </div>

      <div className="table-scroll overflow-x-auto pb-2">
        <table className="select-none border-collapse text-center text-[13px] font-bold">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 h-8 min-w-24 border-2 border-black bg-white" />
              {days.map((day) => (
                <th
                  key={isoDate(day)}
                  className={clsx("h-8 min-w-12 border-2 border-black", isYellowDay(day) ? "bg-yellow-300" : "bg-white")}
                >
                  {day.getDate()}
                </th>
              ))}
              <th rowSpan={2} className="min-w-16 border-2 border-black bg-white text-xs">要出勤日</th>
              <th rowSpan={2} className="min-w-12 border-2 border-black bg-white text-xs">代務</th>
            </tr>
            <tr>
              <th className="sticky left-0 z-20 h-8 min-w-24 border-2 border-black bg-white" />
              {days.map((day) => (
                <th
                  key={`${isoDate(day)}-w`}
                  className={clsx("h-8 min-w-12 border-2 border-black", isYellowDay(day) ? "bg-yellow-300" : "bg-white")}
                >
                  {weekdayLabels[day.getDay()]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((person) => (
              <tr key={person.id}>
                <th className="sticky left-0 z-10 h-12 min-w-24 whitespace-nowrap border-2 border-black bg-white px-2 text-left">
                  {person.name}
                </th>
                {days.map((day) => {
                  const date = isoDate(day);
                  const shift = shiftMap.get(`${date}:${person.id}`);
                  const leave = leaveMap.get(`${date}:${person.id}`);
                  const label = cellLabel(shift, leave);
                  const canRequestLeave = !interactionsDisabled && person.id === currentStaffId && shift && !leave;
                  const canOffer =
                    !interactionsDisabled &&
                    leave &&
                    leave.staffId !== currentStaffId &&
                    !shiftMap.get(`${date}:${currentStaffId}`) &&
                    leave.status !== "APPROVED";
                  const isChanged = Boolean(leave && leave.status !== "REJECTED") || shift?.isSubstitute;
                  const isCandidate = leave?.substituteOffers.some((offer) => offer.status === "PENDING");

                  const className = clsx(
                    "h-12 min-w-12 border-2 border-black p-0 align-middle",
                    isYellowDay(day) && "bg-yellow-300",
                    leave?.status === "SEEKING_SUBSTITUTE" && "bg-red-100",
                    isCandidate && "bg-pink-200",
                    leave?.status === "APPROVED" && "bg-gray-300",
                    leave?.status === "CONSULTATION" && "bg-black text-white",
                    isChanged && "outline outline-2 outline-red-500 outline-offset-[-3px]",
                  );

                  if (canRequestLeave) {
                    return (
                      <td key={`${person.id}-${date}`} className={className}>
                        <form action={createLeaveRequest} className="h-full w-full">
                          <input type="hidden" name="staffId" value={person.id} />
                          <input type="hidden" name="date" value={date} />
                          <input type="hidden" name="month" value={month} />
                          <input type="hidden" name="type" value="FULL" />
                          <button type="submit" className="shift-cell-button flex h-12 w-full items-center justify-center px-1 font-black">
                            {label}
                          </button>
                        </form>
                      </td>
                    );
                  }

                  if (canOffer) {
                    return (
                      <td key={`${person.id}-${date}`} className={className}>
                        <form action={createSubstituteOffer} className="h-full w-full">
                          <input type="hidden" name="leaveRequestId" value={leave.id} />
                          <input type="hidden" name="staffId" value={currentStaffId} />
                          <input type="hidden" name="month" value={month} />
                          <button type="submit" className="shift-cell-button flex h-12 w-full items-center justify-center px-1 text-[11px] font-black">
                            {label}
                          </button>
                        </form>
                      </td>
                    );
                  }

                  if (!interactionsDisabled && isAdmin && leave && leave.status !== "APPROVED") {
                    return (
                      <td key={`${person.id}-${date}`} className={className}>
                        <div className="grid h-12 grid-cols-2">
                          <form action={approveLeaveFromCell} className="h-full w-full">
                            <input type="hidden" name="leaveRequestId" value={leave.id} />
                            <input type="hidden" name="month" value={month} />
                            <button type="submit" className="shift-cell-button flex h-12 w-full items-center justify-center text-[10px] font-black">
                              承認
                            </button>
                          </form>
                          <form action={rejectLeaveFromCell} className="h-full w-full">
                            <input type="hidden" name="id" value={leave.id} />
                            <input type="hidden" name="month" value={month} />
                            <button type="submit" className="shift-cell-button flex h-12 w-full items-center justify-center border-l-2 border-black text-[10px] font-black">
                              却下
                            </button>
                          </form>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={`${person.id}-${date}`} className={className}>
                      <span className={clsx(label.length > 2 ? "text-[10px]" : "text-lg")}>{label}</span>
                    </td>
                  );
                })}
                <td className="h-12 min-w-16 border-2 border-black bg-white">{requiredCount.get(person.id) ?? 0}</td>
                <td className="h-12 min-w-12 border-2 border-black bg-white">
                  {shifts.filter((shift) => shift.replacedStaffId === person.id).length || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
