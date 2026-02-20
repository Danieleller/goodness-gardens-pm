import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goodness Gardens — Task Manager",
  description: "Lightweight task delegation for the Goodness Gardens team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-[#faf8f5] text-[#2d2520]">{children}</body>
    </html>
  );
}
