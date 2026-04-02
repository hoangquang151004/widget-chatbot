"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    label: "Tổng quan",
    icon: "dashboard",
    href: "/admin",
  },
  {
    label: "Quản lý Khách hàng (Tenants)",
    icon: "business",
    href: "/admin/tenants",
  },
  {
    label: "Cấu hình Hệ thống",
    icon: "settings",
    href: "/admin/settings",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth(); // Có thể cần cập nhật riêng context cho Admin sau

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-50 flex flex-col p-4 border-r border-slate-200 bg-slate-900 text-slate-300">
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
            admin_panel_settings
          </span>
        </div>
        <div className="overflow-hidden">
          <h1 className="text-sm font-black text-white leading-tight truncate">
            XenoAI
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
            Super Admin
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-inter text-[13px] ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800 hover:translate-x-1 font-medium"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 text-[13px] font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
