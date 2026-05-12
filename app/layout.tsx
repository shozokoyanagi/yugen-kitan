import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "みんなの有給シフト",
  description: "小規模職場向けの有給休暇とシフト調整アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
