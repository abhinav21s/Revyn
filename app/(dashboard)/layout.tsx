import React from "react";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F4F6FA] flex flex-col">
      {/* 2-Row Fintech Header (Row 1: 64px, Row 2: 44px) */}
      <Header />

      {/* Centered Page Container (max-width: 1280px, centered, 32px desktop padding, 16px mobile) */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-10 pb-12">
        {children}
      </main>
    </div>
  );
}
