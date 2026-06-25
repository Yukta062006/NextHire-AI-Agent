import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Copilot } from "@/components/layout/Copilot";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        <TopNav />
        <main className="flex-1 p-6 relative z-10 overflow-y-auto">
          {children}
        </main>
        <Copilot />
      </div>
    </div>
  );
}
