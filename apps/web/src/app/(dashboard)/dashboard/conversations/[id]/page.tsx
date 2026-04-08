"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";
import { useParams } from "next/navigation";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  intent?: string;
  rag_sources?: { filename: string; page?: number }[];
  sql_query?: string;
  latency_ms?: number;
  token_count?: number;
  created_at: string;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationDetailPage() {
  const { id } = useParams();
  const api = useApi();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = (await api.get(`/api/v1/admin/conversations/${id}`)) as ChatMessage[];
        setMessages(data || []);
      } catch (err: any) {
        setError(err.message || "Không thể tải chi tiết hội thoại.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) loadMessages();
  }, [id, api]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/conversations"
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </Link>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chi tiết hội thoại</h2>
            <p className="text-sm text-slate-500 font-mono uppercase tracking-tighter">ID: {id}</p>
          </div>
        </div>
        <div className="flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
               {messages.length} tin nhắn
            </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
             <p className="text-sm text-slate-500 font-medium">Đang truy xuất tin nhắn...</p>
          </div>
        ) : messages.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic p-10 text-center">
              Phiên chat này chưa có nội dung tin nhắn.
           </div>
        ) : (
          <div className="flex-1 p-6 space-y-8 overflow-y-auto max-h-[700px]">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1.5 px-1">
                   {m.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                         <span className="material-symbols-outlined text-white text-[14px]">psychology</span>
                      </div>
                   )}
                   <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {m.role === "user" ? "Khách hàng" : "Trợ lý AI"}
                   </span>
                   <span className="text-[10px] text-slate-300">•</span>
                   <span className="text-[10px] text-slate-400">{formatTime(m.created_at)}</span>
                </div>

                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100" 
                      : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                  }`}
                >
                  {m.content}
                </div>

                {/* Metadata for Admin (Assistant only) */}
                {m.role === "assistant" && (m.intent || m.latency_ms || m.sql_query || m.rag_sources) && (
                   <div className="mt-3 ml-1 w-full max-w-[90%] bg-slate-50 rounded-xl border border-dashed border-slate-200 p-3 space-y-2">
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                         <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">explore</span>
                            Intent: <span className="text-indigo-600">{m.intent || "general"}</span>
                         </span>
                         {m.latency_ms && (
                            <span className="flex items-center gap-1">
                               <span className="material-symbols-outlined text-[12px]">timer</span>
                               {m.latency_ms}ms
                            </span>
                         )}
                         {m.token_count && (
                            <span className="flex items-center gap-1">
                               <span className="material-symbols-outlined text-[12px]">token</span>
                               {m.token_count} tokens
                            </span>
                         )}
                      </div>
                      
                      {m.sql_query && (
                         <div className="bg-slate-900 rounded-lg p-2.5 overflow-x-auto">
                            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">SQL Query Executed:</p>
                            <code className="text-[11px] text-emerald-400 font-mono whitespace-pre">{m.sql_query}</code>
                         </div>
                      )}

                      {m.rag_sources && m.rag_sources.length > 0 && (
                         <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 font-bold uppercase">Sources (RAG):</p>
                            <div className="flex flex-wrap gap-1.5">
                               {m.rag_sources.map((src, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600">
                                     <span className="material-symbols-outlined text-[10px]">description</span>
                                     {src.filename} {src.page ? `(p.${src.page})` : ""}
                                  </span>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
           <p className="text-[10px] text-center text-slate-400 font-medium italic">
              Bản ghi hội thoại này được lưu trữ để phục vụ mục đích kiểm tra chất lượng và huấn luyện AI.
           </p>
        </div>
      </div>
    </div>
  );
}
