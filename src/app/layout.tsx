import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXTHIRE | AI Hiring Intelligence Platform",
  description: "Ace Every Interview with AI-powered hiring intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
