import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "春节红包雨 · 手速挑战",
  description: "春节主题红包小游戏，30 秒手速挑战，支持本机排行榜。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
