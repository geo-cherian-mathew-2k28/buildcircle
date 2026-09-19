import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildCircle — Build. Learn. Connect.",
  description: "A community-first platform for people who build.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
