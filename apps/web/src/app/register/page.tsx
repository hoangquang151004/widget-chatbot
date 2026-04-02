"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          allowed_origins: ["*"], // Mặc định cho phép mọi domain trong lúc test
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Đăng ký thành công -> Tự động đăng nhập
        await login(formData.email, formData.password);
      } else {
        setError(data.detail || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-tertiary-fixed rounded-full blur-[100px] opacity-30"></div>
      </div>

      <main className="flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                add_business
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface mb-1">Bắt đầu với XenoAI</h1>
            <p className="text-on-surface-variant text-sm">Tạo tài khoản doanh nghiệp của bạn</p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0_32px_64px_-12px_rgba(53,37,205,0.08)] ring-1 ring-outline-variant/10">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Tên doanh nghiệp */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="name">
                  Tên doanh nghiệp
                </label>
                <input
                  className="block w-full px-4 py-3 bg-surface-container-highest border-none rounded-lg text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  id="name"
                  placeholder="Ví dụ: Công ty Antigravity"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="slug">
                  Slug định danh (Dùng cho Widget)
                </label>
                <div className="relative">
                   <input
                    className="block w-full px-4 py-3 bg-surface-container-highest border-none rounded-lg text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all"
                    id="slug"
                    placeholder="my-company"
                    type="text"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                  />
                  <p className="mt-1 text-[10px] text-on-surface-variant ml-1 italic">
                    Chỉ dùng chữ thường, số và dấu gạch ngang.
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">
                  Email quản trị
                </label>
                <input
                  className="block w-full px-4 py-3 bg-surface-container-highest border-none rounded-lg text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  id="email"
                  placeholder="admin@example.com"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="password">
                  Mật khẩu bảo mật
                </label>
                <input
                  className="block w-full px-4 py-3 bg-surface-container-highest border-none rounded-lg text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <div className="bg-error/10 text-error text-[11px] p-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <button
                className="w-full bg-primary hover:bg-primary-container text-white font-bold py-4 rounded-full transition-all shadow-md shadow-primary/20 active:scale-[0.98] disabled:opacity-50 mt-4"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Khởi tạo tài khoản"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-on-surface-variant">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center">
        <p className="text-[10px] text-outline/40 font-medium">© 2024 XenoAI Platform. Tất cả quyền được bảo lưu.</p>
      </footer>
    </div>
  );
}
