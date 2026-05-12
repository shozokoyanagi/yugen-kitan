import { prisma } from "./prisma";
import { toDateOnly } from "./date";
import type { LeaveStatus, LeaveType } from "../types/domain";

export const MIN_STAFF_PER_DAY = 3;

export function leaveAmount(type: LeaveType) {
  return type === "HALF" ? 0.5 : 1;
}

export async function countScheduledWorkers(date: Date) {
  const day = toDateOnly(date);
  const [shiftCount, approvedLeaves] = await Promise.all([
    prisma.shift.count({ where: { date: day } }),
    prisma.leaveRequest.count({
      where: {
        date: day,
        status: "APPROVED",
        staff: { shifts: { some: { date: day } } },
      },
    }),
  ]);

  return Math.max(0, shiftCount - approvedLeaves);
}

export async function evaluateLeaveStatus(staffId: string, date: Date) {
  const day = toDateOnly(date);
  const scheduledCount = await prisma.shift.count({ where: { date: day } });
  const isScheduled = await prisma.shift.findUnique({
    where: { date_staffId: { date: day, staffId } },
  });

  if (!isScheduled) return "APPROVABLE" satisfies LeaveStatus;
  return scheduledCount - 1 >= MIN_STAFF_PER_DAY
    ? ("APPROVABLE" satisfies LeaveStatus)
    : ("SEEKING_SUBSTITUTE" satisfies LeaveStatus);
}

export async function dailyStaffing(date: Date) {
  const day = toDateOnly(date);
  const [shifts, approvedLeaves, pendingOffers] = await Promise.all([
    prisma.shift.findMany({
      where: { date: day },
      include: { staff: true },
      orderBy: { staff: { name: "asc" } },
    }),
    prisma.leaveRequest.findMany({
      where: { date: day, status: "APPROVED" },
      include: { staff: true },
    }),
    prisma.substituteOffer.count({
      where: { leaveRequest: { date: day }, status: "PENDING" },
    }),
  ]);

  const approvedLeaveStaffIds = new Set(approvedLeaves.map((leave) => leave.staffId));
  const currentWorkers = shifts.filter((shift) => !approvedLeaveStaffIds.has(shift.staffId));

  return {
    date: day,
    shiftCount: shifts.length,
    approvedLeaveCount: approvedLeaves.length,
    substituteCount: shifts.filter((shift) => shift.isSubstitute).length,
    pendingOfferCount: pendingOffers,
    currentCount: currentWorkers.length,
    isOk: currentWorkers.length >= MIN_STAFF_PER_DAY,
  };
}
