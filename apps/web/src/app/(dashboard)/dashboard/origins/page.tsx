"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";

type OriginRow = {
  id: string;
  origin: string;
  note: string | null;
  created_at: string;
};

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function OriginsPage() {
  const api = useApi();
  const { accessToken } = useAuth();

  const [rows, setRows] = useState<OriginRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [originInput, setOriginInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setError("");
    try {
      const data = (await api.get(
        "/api/v1/admin/origins",
      )) as OriginRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tải danh sách domain.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const origin = originInput.trim();
    if (!origin) {
      setError("Vui lòng nhập domain hoặc origin (ví dụ https://example.com).");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/v1/admin/origins", {
        origin,
        note: noteInput.trim() || null,
      });
      setMessage("Đã thêm domain. Widget chỉ chấp nhận request từ các domain trong danh sách (theo cấu hình backend).");
      setOriginInput("");
      setNoteInput("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Thêm domain thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (row: OriginRow) => {
    if (
      !confirm(
        `Xóa domain "${row.origin}"? Widget từ origin này có thể bị từ chối.`,
      )
    ) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await api.del(`/api/v1/admin/origins/${row.id}`);
      setMessage("Đã xóa domain.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Xóa thất bại.");
    }
  };

  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
          Domain cho widget (CORS)
        </h2>
        <p className="text-on-surface-variant max-w-2xl">
          Khai báo các domain được phép nhúng chatbot. Nhập URL đầy đủ (ví dụ{" "}
          <code className="text-sm bg-slate-100 px-1 rounded">https://site.com</code>) hoặc chỉ{" "}
          <code className="text-sm bg-slate-100 px-1 rounded">site.com</code>
          — backend sẽ chuẩn hóa giống khi đăng ký tenant.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <form
            onSubmit={handleAdd}
            className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-4"
          >
            <h3 className="text-lg font-bold">Thêm domain</h3>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                Origin / domain
              </label>
              <input
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="https://example.com"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                Ghi chú (tùy chọn)
              </label>
              <input
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Landing production"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !accessToken}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {isSubmitting ? "Đang thêm..." : "Thêm"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Danh sách đã cấu hình</h3>
              <button
                type="button"
                onClick={() => load()}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Làm mới
              </button>
            </div>
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Domain (chuẩn hóa)</th>
                      <th className="px-6 py-4">Ghi chú</th>
                      <th className="px-6 py-4">Tạo lúc</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-sm text-on-surface-variant"
                        >
                          Chưa có domain nào. Thêm ít nhất một domain để giới hạn nguồn gọi API widget.
                        </td>
                      </tr>
                    )}
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                            {row.origin}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {row.note || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formatCreatedAt(row.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="text-slate-400 hover:text-red-600"
                            aria-label="Xóa"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
