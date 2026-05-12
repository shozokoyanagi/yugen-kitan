"use client";

import { useEffect, useState } from "react";
import type { Staff } from "@prisma/client";
import { linkLineStaff } from "../../app/actions";

type LiffBridgeProps = {
  staff: Staff[];
  currentStaffId?: string;
  lineUserId?: string;
  month: string;
};

export function LiffBridge({ staff, currentStaffId, lineUserId, month }: LiffBridgeProps) {
  const [detectedLineUserId, setDetectedLineUserId] = useState(lineUserId ?? "");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) return;

      const liff = (await import("@line/liff")).default;
      await liff.init({ liffId });

      if (!liff.isLoggedIn() && !liff.isInClient()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      if (cancelled) return;

      setDetectedLineUserId(profile.userId);
      const url = new URL(window.location.href);
      if (url.searchParams.get("lineUserId") !== profile.userId) {
        url.searchParams.set("lineUserId", profile.userId);
        window.location.replace(url.toString());
      }
    }

    boot().catch((error) => {
      console.error("LIFF init failed", error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!detectedLineUserId || currentStaffId) return null;

  return (
    <form action={linkLineStaff} className="mx-2 mb-2 flex items-center gap-2 rounded border border-black bg-white p-2 text-xs">
      <input type="hidden" name="lineUserId" value={detectedLineUserId} />
      <input type="hidden" name="month" value={month} />
      <span className="font-bold">LINE紐づけ</span>
      <select name="staffId" className="min-w-0 flex-1 border border-black bg-white px-2 py-1">
        {staff.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
      <button className="border border-black bg-yellow-200 px-2 py-1 font-bold">保存</button>
    </form>
  );
}
