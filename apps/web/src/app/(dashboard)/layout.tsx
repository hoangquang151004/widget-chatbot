"use client";

import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopAppBar from "@/components/TopAppBar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { secretKey, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !secretKey) {
      router.push("/login");
    }
  }, [secretKey, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-on-surface-variant animate-pulse">Đang tải dữ liệu hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!secretKey) return null;

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <main className="ml-64 min-h-screen relative">
        <TopAppBar />
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
