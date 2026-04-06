"use client";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";

export default function SupportPage() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "[Widget Chatbot] Hỗ trợ",
  )}`;

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
          Hỗ trợ
        </h2>
        <p className="text-on-surface-variant">
          Tài nguyên nhanh và cách liên hệ đội ngũ hỗ trợ.
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">mail</span>
            Liên hệ
          </h3>
          <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
            Gửi email mô tả vấn đề (kèm tenant email, mã lỗi nếu có). Địa chỉ mặc định
            có thể đổi bằng biến môi trường{" "}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              NEXT_PUBLIC_SUPPORT_EMAIL
            </code>{" "}
            trên frontend.
          </p>
          <a
            href={mailto}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
            {SUPPORT_EMAIL}
          </a>
        </section>

        <section className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Trước khi gửi yêu cầu</h3>
          <ul className="space-y-3 text-sm text-on-surface-variant">
            <li className="flex gap-2">
              <span className="text-primary font-bold">1.</span>
              Kiểm tra trang{" "}
              <strong className="text-on-surface">Domain cho widget</strong> — domain
              site nhúng script phải nằm trong whitelist CORS.
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">2.</span>
              Xác nhận <strong className="text-on-surface">public key</strong> trong
              mã nhúng khớp key đang hoạt động (mục Khóa API).
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">3.</span>
              Với RAG: đảm bảo tài liệu ở trạng thái thành công trên Cơ sở tri thức.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
