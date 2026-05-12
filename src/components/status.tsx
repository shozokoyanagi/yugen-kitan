import clsx from "clsx";
import type { LeaveStatus, OfferStatus } from "@/types/domain";

const leaveLabels: Record<LeaveStatus, string> = {
  APPROVABLE: "承認可能",
  SEEKING_SUBSTITUTE: "代替者募集中",
  CONSULTATION: "要相談",
  APPROVED: "承認済み",
  REJECTED: "却下",
};

const offerLabels: Record<OfferStatus, string> = {
  PENDING: "申請中",
  APPROVED: "承認済み",
  REJECTED: "見送り",
};

export function leaveStatusLabel(status: string) {
  return leaveLabels[status as LeaveStatus] ?? status;
}

export function StatusBadge({ status }: { status: string }) {
  const typedStatus = status as LeaveStatus;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        typedStatus === "APPROVED" && "bg-leaf-100 text-leaf-700",
        typedStatus === "APPROVABLE" && "bg-sky-100 text-sky-700",
        typedStatus === "SEEKING_SUBSTITUTE" && "bg-coral-50 text-coral-700",
        typedStatus === "CONSULTATION" && "bg-amber-100 text-amber-800",
        typedStatus === "REJECTED" && "bg-stone-200 text-stone-600",
      )}
    >
      {leaveLabels[typedStatus] ?? status}
    </span>
  );
}

export function OfferBadge({ status }: { status: string }) {
  const typedStatus = status as OfferStatus;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        typedStatus === "APPROVED" && "bg-leaf-100 text-leaf-700",
        typedStatus === "PENDING" && "bg-amber-100 text-amber-800",
        typedStatus === "REJECTED" && "bg-stone-200 text-stone-600",
      )}
    >
      {offerLabels[typedStatus] ?? status}
    </span>
  );
}
