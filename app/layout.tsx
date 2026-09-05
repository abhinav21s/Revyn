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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event.reason;
                  var str = String((reason && (reason.message || reason.stack || reason)) || '');
                  if (
                    str.indexOf('chrome-extension://') !== -1 ||
                    str.indexOf('disconnected from all chains') !== -1 ||
                    str.indexOf('provider is disconnected') !== -1 ||
                    str.indexOf('MetaMask') !== -1 ||
                    str.indexOf('Coinbase') !== -1 ||
                    str.indexOf('Phantom') !== -1 ||
                    (reason && typeof reason === 'object' && Object.keys(reason).length === 0)
                  ) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
