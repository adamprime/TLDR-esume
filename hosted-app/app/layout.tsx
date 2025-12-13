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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-paper text-ink font-mono selection:bg-accent selection:text-black">
        {children}
      </body>
    </html>
  );
}
