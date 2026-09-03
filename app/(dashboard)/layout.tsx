import React from "react";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-white">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 space-y-6 max-w-screen-xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
