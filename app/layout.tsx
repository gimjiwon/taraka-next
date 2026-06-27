import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAKARA | 보물은 항상 기다리고 있다.",
  description: "온라인 쿠지와 애니 굿즈를 한 곳에서"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
