"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";

type ChatSession = {
  id: string;
  visitor_id: string;
  message_count: number;
  is_active: boolean;
  started_at: string;
  last_active_at: string;
  ended_at: string | null;
};

function formatDateTime(iso: string): string {
  if (!iso) return "N/A";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ConversationsPage() {
  const api = useApi();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const loadSessions = useCallback(async (p: number) => {
    setIsLoading(true);
    setError("");
    try {
      const data = (await api.get(`/api/v1/admin/conversations?page=${p}&page_size=20`)) as ChatSession[];
      setSessions(data || []);
    } catch (err: any) {
      setError(err.message || "Không thể tải lịch sử hội thoại.");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadSessions(page);
  }, [page, loadSessions]);

  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
          Lịch sử hội thoại
        </h2>
        <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl">
          Xem lại toàn bộ các cuộc trao đổi giữa trợ lý AI và khách hàng để cải thiện chất lượng phục vụ.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-bold text-slate-900">Danh sách phiên chat</h3>
          <div className="flex gap-2">
             <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="p-2 hover:bg-white rounded-lg border border-slate-200 disabled:opacity-50 transition-colors"
             >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
             </button>
             <span className="flex items-center px-4 text-sm font-medium text-slate-600">Trang {page}</span>
             <button 
                onClick={() => setPage(p => p + 1)}
                disabled={sessions.length < 20 || isLoading}
                className="p-2 hover:bg-white rounded-lg border border-slate-200 disabled:opacity-50 transition-colors"
             >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
             </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <p className="text-sm text-slate-500 font-medium animate-pulse">Đang tải dữ liệu hội thoại...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">chat_bubble_outline</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Chưa có hội thoại nào</h4>
            <p className="text-slate-500 text-sm max-w-xs">Các cuộc hội thoại từ widget sẽ xuất hiện tại đây sau khi khách hàng bắt đầu nhắn tin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tin nhắn</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian bắt đầu</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hoạt động cuối</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-indigo-600">person</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{s.visitor_id}</span>
                            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">ID: {s.id.slice(0, 8)}...</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-black min-w-[32px]">
                          {s.message_count}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatDateTime(s.started_at)}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                      {formatDateTime(s.last_active_at)}
                    </td>
                    <td className="px-6 py-5">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                         s.is_active 
                           ? "bg-emerald-100 text-emerald-700" 
                           : "bg-slate-100 text-slate-500"
                       }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                          {s.is_active ? "Đang chat" : "Đã kết thúc"}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <Link 
                          href={`/dashboard/conversations/${s.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-indigo-700 font-bold text-sm transition-all hover:translate-x-1"
                       >
                          <span>Xem</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                       </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
