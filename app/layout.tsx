import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JJL Lawn Services",
  description: "Simple lawn crew management for quotes, jobs, payments, and earnings.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
