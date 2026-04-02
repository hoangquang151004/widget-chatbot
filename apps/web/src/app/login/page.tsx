"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const success = await login(email.trim(), password.trim());
    if (!success) {
      setError("Email hoặc mật khẩu không chính xác.");
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-tertiary-fixed rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-64 bg-gradient-to-t from-primary/5 to-transparent blur-3xl"></div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                psychology
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">XenoAI Admin</h1>
            <p className="text-on-surface-variant text-sm font-medium">Chào mừng bạn quay trở lại với trợ lý thông minh</p>
          </div>

          {/* Auth Card */}
          <div className="bg-surface-container-lowest p-8 sm:p-10 rounded-2xl shadow-[0_32px_64px_-12px_rgba(53,37,205,0.08)] ring-1 ring-outline-variant/10">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-on-surface">Đăng nhập</h2>
                <Link className="text-sm font-semibold text-primary hover:underline underline-offset-4" href="/register">
                  Đăng ký ngay
                </Link>
              </div>
              <p className="text-sm text-on-surface-variant">Vui lòng nhập thông tin của bạn</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Input Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    className="block w-full pl-11 pr-4 py-3.5 bg-surface-container-highest border-none rounded-lg text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    id="email"
                    placeholder="example@email.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="password">
                    Mật khẩu
                  </label>
                  <a className="text-xs font-semibold text-primary hover:text-primary-container transition-colors" href="#">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    className="block w-full pl-11 pr-4 py-3.5 bg-surface-container-highest border-none rounded-lg text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-error/10 text-error text-xs p-3 rounded-lg flex items-center gap-2 animate-pulse">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                className="w-full bg-primary hover:bg-primary-container text-white font-bold py-4 rounded-full transition-all duration-300 shadow-md shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Đang xác thực..." : "Đăng nhập"}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>

              {/* Divider */}
              <div className="relative py-4">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/30"></div>
                </div>
                <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                  <span className="bg-surface-container-lowest px-4 text-outline/60">Hoặc tiếp tục với</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                className="w-full bg-surface-container-low hover:bg-surface-container-high text-on-surface font-semibold py-4 rounded-full transition-all duration-300 border border-outline-variant/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                type="button"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  ></path>
                </svg>
                Google Account
              </button>
            </form>
          </div>

          {/* Security Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-outline/50">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Hệ thống bảo mật bởi Xeno Guard</span>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="p-6 text-center">
        <p className="text-[10px] text-outline/40 font-medium">© 2024 XenoAI Ecosystem. Powered by Antigravity.</p>
      </footer>
    </div>
  );
}
