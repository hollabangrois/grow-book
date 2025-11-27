import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grow Book - Training Management System",
  description: "Training Management System with AdminLTE Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

