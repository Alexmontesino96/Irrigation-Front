"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ScaleProvider, useScale } from "@/lib/scale-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { scale } = useScale();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 origin-top-left"
          style={{ zoom: scale }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScaleProvider>
      <DashboardContent>{children}</DashboardContent>
    </ScaleProvider>
  );
}
