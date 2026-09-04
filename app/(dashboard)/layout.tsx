"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { GlobalToastContainer } from "@/components/global-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#06080F] text-[#F8FAFC]">
      {/* Global Top-Mounted Toast Notifications */}
      <GlobalToastContainer />

      {/* Desktop Sidebar: normal flex sibling (sticky top-0 h-screen, exactly 260px) */}
      <aside className="hidden md:flex w-[260px] shrink-0 border-r border-[#1C273E] bg-[#090D17] sticky top-0 h-screen flex-col z-30">
        <Sidebar />
      </aside>

      {/* Mobile Drawer (<md) */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-[260px] h-full shadow-2xl bg-[#090D17]">
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area: flex-1 min-w-0, completely unblocked */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onToggleSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-[1440px] w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
