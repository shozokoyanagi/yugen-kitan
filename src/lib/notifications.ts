export type NotificationEvent =
  | {
      type: "leave_created";
      staffName: string;
      date: string;
      status: string;
    }
  | {
      type: "substitute_offered";
      staffName: string;
      requesterName: string;
      date: string;
    }
  | {
      type: "admin_decision";
      staffName: string;
      date: string;
      approved: boolean;
    };

export async function notifyTeam(event: NotificationEvent) {
  // LINE通知を足す時は、この関数の中身をLINE Messaging APIへ差し替える。
  console.log("[notification placeholder]", event);
}
