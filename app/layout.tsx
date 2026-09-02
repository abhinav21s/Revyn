import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revyn – AI Payment Recovery Agent",
  description:
    "Bounded AI agent that detects, diagnoses, and safely recovers failed payments for Indian merchants using Razorpay.",
  keywords: ["payment recovery", "fintech", "razorpay", "AI", "revenue recovery"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
