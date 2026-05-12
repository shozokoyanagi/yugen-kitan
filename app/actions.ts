"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isoDate, toDateOnly } from "@/lib/date";
import { evaluateLeaveStatus, leaveAmount } from "@/lib/leaveRules";
import { importShiftRows, parseShiftCsv } from "@/lib/import";
import { notifyTeam } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { LeaveStatus, LeaveType, OfferStatus, Role } from "@/types/domain";

function refresh(month?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
}

const staffSchema = z.object({
  name: z.string().min(1),
  joinedAt: z.string().min(1),
  paidLeaveBalance: z.coerce.number().min(0),
  role: z.enum(["ADMIN", "STAFF"]),
});

export async function createStaff(formData: FormData) {
  const values = staffSchema.parse(Object.fromEntries(formData));
  await prisma.staff.create({
    data: {
      name: values.name,
      joinedAt: toDateOnly(values.joinedAt),
      paidLeaveBalance: values.paidLeaveBalance,
      role: values.role,
    },
  });
  refresh();
}

export async function createShift(formData: FormData) {
  const staffId = String(formData.get("staffId"));
  const date = toDateOnly(String(formData.get("date")));
  const workCode = String(formData.get("workCode") || "①");
  const month = String(formData.get("month") || isoDate(date).slice(0, 7));

  await prisma.shift.upsert({
    where: { date_staffId: { date, staffId } },
    create: { date, staffId, workCode, source: "manual" },
    update: { workCode, source: "manual" },
  });
  refresh(month);
}

export async function removeShift(formData: FormData) {
  const staffId = String(formData.get("staffId"));
  const date = toDateOnly(String(formData.get("date")));
  const month = String(formData.get("month") || isoDate(date).slice(0, 7));

  await prisma.shift.deleteMany({ where: { date, staffId, isSubstitute: false } });
  refresh(month);
}

export async function createLeaveRequest(formData: FormData) {
  const staffId = String(formData.get("staffId"));
  const date = toDateOnly(String(formData.get("date")));
  const type = String(formData.get("type")) as LeaveType;
  const memo = String(formData.get("memo") || "");
  const month = String(formData.get("month") || isoDate(date).slice(0, 7));
  const status = await evaluateLeaveStatus(staffId, date);

  const request = await prisma.leaveRequest.create({
    data: {
      staffId,
      date,
      type,
      memo,
      status,
    },
    include: { staff: true },
  });

  await notifyTeam({
    type: "leave_created",
    staffName: request.staff.name,
    date: isoDate(date),
    status,
  });

  refresh(month);
}

export async function createSubstituteOffer(formData: FormData) {
  const leaveRequestId = String(formData.get("leaveRequestId"));
  const staffId = String(formData.get("staffId"));
  const message = String(formData.get("message") || "");
  const month = String(formData.get("month") || "");

  const leave = await prisma.leaveRequest.findUniqueOrThrow({
    where: { id: leaveRequestId },
    include: { staff: true },
  });

  if (leave.staffId === staffId) {
    throw new Error("本人は代替出勤を申請できません");
  }

  const existingShift = await prisma.shift.findUnique({
    where: { date_staffId: { date: leave.date, staffId } },
  });
  if (existingShift) {
    throw new Error("すでに出勤予定のスタッフは代替申請できません");
  }

  const offer = await prisma.substituteOffer.create({
    data: { leaveRequestId, staffId, message },
    include: { staff: true },
  });

  await notifyTeam({
    type: "substitute_offered",
    staffName: offer.staff.name,
    requesterName: leave.staff.name,
    date: isoDate(leave.date),
  });

  refresh(month || isoDate(leave.date).slice(0, 7));
}

export async function updateLeaveStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as LeaveStatus;
  const month = String(formData.get("month") || "");

  const leave = await prisma.leaveRequest.findUniqueOrThrow({
    where: { id },
    include: { staff: true },
  });

  if (status === "APPROVED" && leave.status !== "APPROVED") {
    const amount = leaveAmount(leave.type as LeaveType);
    await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id },
        data: { status, decidedAt: new Date() },
      }),
      prisma.staff.update({
        where: { id: leave.staffId },
        data: { paidLeaveBalance: { decrement: amount } },
      }),
      prisma.paidLeaveHistory.create({
        data: {
          staffId: leave.staffId,
          leaveRequestId: id,
          amount: -amount,
          note: "有給承認",
        },
      }),
    ]);
  } else {
    await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        decidedAt: status === "REJECTED" ? new Date() : leave.decidedAt,
      },
    });
  }

  await notifyTeam({
    type: "admin_decision",
    staffName: leave.staff.name,
    date: isoDate(leave.date),
    approved: status === "APPROVED",
  });

  refresh(month || isoDate(leave.date).slice(0, 7));
}

export async function markConsultation(formData: FormData) {
  formData.set("status", "CONSULTATION");
  await updateLeaveStatus(formData);
}

export async function decideSubstituteOffer(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OfferStatus;
  const month = String(formData.get("month") || "");

  const offer = await prisma.substituteOffer.findUniqueOrThrow({
    where: { id },
    include: { leaveRequest: true },
  });

  if (status === "APPROVED") {
    await prisma.$transaction([
      prisma.substituteOffer.update({
        where: { id },
        data: { status, decidedAt: new Date() },
      }),
      prisma.substituteOffer.updateMany({
        where: {
          leaveRequestId: offer.leaveRequestId,
          id: { not: id },
          status: "PENDING",
        },
        data: { status: "REJECTED", decidedAt: new Date() },
      }),
      prisma.leaveRequest.update({
        where: { id: offer.leaveRequestId },
        data: {
          status: "APPROVABLE",
          substituteStaffId: offer.staffId,
        },
      }),
      prisma.shift.upsert({
        where: {
          date_staffId: {
            date: offer.leaveRequest.date,
            staffId: offer.staffId,
          },
        },
        create: {
          date: offer.leaveRequest.date,
          staffId: offer.staffId,
          workCode: "代",
          isSubstitute: true,
          replacedStaffId: offer.leaveRequest.staffId,
          source: "substitute",
        },
        update: {
          workCode: "代",
          isSubstitute: true,
          replacedStaffId: offer.leaveRequest.staffId,
          source: "substitute",
        },
      }),
    ]);
  } else {
    await prisma.substituteOffer.update({
      where: { id },
      data: { status, decidedAt: new Date() },
    });
  }

  refresh(month || isoDate(offer.leaveRequest.date).slice(0, 7));
}

export async function importShiftCsvAction(formData: FormData) {
  const csv = String(formData.get("csv") || "");
  const rows = parseShiftCsv(csv);
  await importShiftRows(rows);
  refresh();
}
