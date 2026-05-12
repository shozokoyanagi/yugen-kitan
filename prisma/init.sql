PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS "PaidLeaveHistory";
DROP TABLE IF EXISTS "SubstituteOffer";
DROP TABLE IF EXISTS "LeaveRequest";
DROP TABLE IF EXISTS "Shift";
DROP TABLE IF EXISTS "Staff";

CREATE TABLE "Staff" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "lineUserId" TEXT,
  "joinedAt" DATETIME NOT NULL,
  "paidLeaveBalance" REAL NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'STAFF',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Shift" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" DATETIME NOT NULL,
  "workCode" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
  "replacedStaffId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Shift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "LeaveRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" DATETIME NOT NULL,
  "type" TEXT NOT NULL,
  "memo" TEXT,
  "status" TEXT NOT NULL DEFAULT 'APPROVABLE',
  "staffId" TEXT NOT NULL,
  "substituteStaffId" TEXT,
  "decidedAt" DATETIME,
  "rejectedReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "LeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SubstituteOffer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaveRequestId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "decidedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SubstituteOffer_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SubstituteOffer_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PaidLeaveHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "staffId" TEXT NOT NULL,
  "leaveRequestId" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaidLeaveHistory_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaidLeaveHistory_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Shift_date_staffId_key" ON "Shift"("date", "staffId");
CREATE UNIQUE INDEX "Staff_lineUserId_key" ON "Staff"("lineUserId");
CREATE INDEX "Shift_date_idx" ON "Shift"("date");
CREATE INDEX "LeaveRequest_date_idx" ON "LeaveRequest"("date");
CREATE UNIQUE INDEX "SubstituteOffer_leaveRequestId_staffId_key" ON "SubstituteOffer"("leaveRequestId", "staffId");

PRAGMA foreign_keys = ON;
