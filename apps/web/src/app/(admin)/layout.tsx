"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, tenant, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.push("/login");
    }
  }, [accessToken, isLoading, router]);

  useEffect(() => {
    if (!isLoading && accessToken && tenant?.role === "tenant") {
      router.replace("/dashboard");
    }
  }, [accessToken, tenant?.role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!accessToken || tenant?.role !== "platform_admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm">
          <h2 className="text-slate-800 font-bold">XenoAI System Administration</h2>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
