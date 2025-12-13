import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TLDR;esume",
  description: "AI-powered resume tailoring that keeps your data local",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f0f] text-gray-100">
        {children}
      </body>
    </html>
  );
}
