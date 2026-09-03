import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0B0F19",
};

export const metadata: Metadata = {
  title: {
    default: "Revyn – Revenue Recovery",
    template: "%s | Revyn",
  },
  description:
    "Bounded AI payment recovery agent for Indian merchants. Autonomous detection, diagnosis and resolution of failed payments using Razorpay.",
  keywords: [
    "payment recovery",
    "fintech",
    "razorpay",
    "AI",
    "revenue recovery",
    "failed payments",
    "UPI",
  ],
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Revyn – Revenue Recovery Agent",
    description:
      "Autonomous bounded AI for recovering failed payments. Strict policy guardrails. Zero trust in the LLM for money decisions.",
    type: "website",
  },
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
