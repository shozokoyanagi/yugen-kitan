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

      if (!liff.isInClient()) {
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
    <form action={linkLineStaff} className="mx-2 mb-2 border-2 border-black bg-yellow-200 p-3 text-sm">
      <input type="hidden" name="lineUserId" value={detectedLineUserId} />
      <input type="hidden" name="month" value={month} />
      <div className="mb-2 font-black">最初に自分の名前を選んで保存してください</div>
      <div className="flex items-center gap-2">
        <select name="staffId" className="min-w-0 flex-1 border-2 border-black bg-white px-2 py-2 font-bold">
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
        <button className="border-2 border-black bg-white px-4 py-2 font-black">保存</button>
      </div>
    </form>
  );
}
