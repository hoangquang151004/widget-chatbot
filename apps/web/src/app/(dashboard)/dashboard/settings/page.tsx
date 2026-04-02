export default function SettingsPage() {
  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Cấu hình Giao diện</h2>
            <p className="text-on-surface-variant text-sm mt-1">Tùy chỉnh cách chatbot hiển thị trên trang web của bạn.</p>
          </div>
          <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            Lưu thay đổi
          </button>
        </div>

        {/* Content Grid (Appearance Tab) */}
        <div className="grid grid-cols-12 gap-10">
          {/* Form Section (Left) */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <div className="bg-surface-container-low p-8 rounded-xl space-y-6">
              {/* Bot Identity */}
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                    Tên Chatbot
                  </span>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary transition-all"
                    placeholder="VD: AI Assistant"
                    type="text"
                    defaultValue="AI Assistant"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                    Lời chào ban đầu
                  </span>
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Nhập câu chào mừng..."
                    type="text"
                    defaultValue="Xin chào! Tôi có thể giúp gì cho bạn?"
                  />
                </label>
              </div>

              {/* Color & Avatar */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-outline-variant/20">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 block">
                    Màu chủ đạo
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-container cursor-pointer shadow-inner border border-white/20"></div>
                    <div className="flex-1 bg-surface-container-highest rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-mono text-on-surface-variant">#4F46E5</span>
                      <span className="material-symbols-outlined text-sm text-outline">colorize</span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 block">
                    Avatar Bot
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white">
                      <img
                        alt="Bot Avatar"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS-qsyaa8CnqkVa6-or25cJGIEbWAFwjAgyCopvH_1gSrUYbBofZqPjCfyKvlKWAgh9rKHzTrjhVVGRNpTENatDD_jIlApgFBEoUDcrXnOMLAdBKzlNFT8ERoHVWtYrEcFfh-cxK4e7W8l0KCqUk7I-WZCpLlM5frjg2O8GBeTuWPosCOr8DOYADMHhlvRvhhCXuCDEN_8LxcAllzQVXcPiPTOjxvnySDUE8tT6J1xyd2u6-vAYiG_FfccojFbpp0XtoNk5Pe1GjhR"
                      />
                    </div>
                    <button className="text-primary text-xs font-bold hover:underline">Tải lên mới</button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Capabilities */}
            <div className="bg-surface-container-low p-8 rounded-xl">
              <h3 className="text-sm font-bold text-on-surface mb-4">Cấu hình AI Nâng cao</h3>
              <div className="space-y-4">
                {[
                  { label: "Kích hoạt truy vấn SQL", desc: "Cho phép bot truy cập dữ liệu cấu trúc.", active: true },
                  { label: "Kích hoạt tri thức RAG", desc: "Truy vấn từ tài liệu Knowledge Base.", active: false },
                ].map((cap, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg">
                    <div>
                      <p className="text-sm font-semibold">{cap.label}</p>
                      <p className="text-xs text-on-surface-variant">{cap.desc}</p>
                    </div>
                    <div
                      className={`w-10 h-5 ${
                        cap.active ? "bg-primary" : "bg-outline-variant"
                      } rounded-full relative cursor-pointer`}
                    >
                      <div
                        className={`absolute ${cap.active ? "right-1" : "left-1"} top-1 w-3 h-3 bg-white rounded-full`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Section (Right) */}
          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-24">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4 block">
                Xem trước (Real-time)
              </span>
              {/* Mockup Phone/Widget */}
              <div className="relative w-full aspect-[4/5] bg-slate-200/30 rounded-[2.5rem] p-4 border-[8px] border-slate-900 shadow-2xl overflow-hidden">
                <div className="w-full h-full bg-white rounded-[1.8rem] flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="p-4 flex items-center gap-3 bg-primary text-on-primary">
                    <div className="w-8 h-8 rounded-full bg-white/20 overflow-hidden">
                      <img
                        alt="Preview Bot"
                        className="w-full h-full"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHvFdOijpiLIkS1KnwoP08LZK9BMWZ9fijUIdPz-WmS7ZxS9BreK54DZ_-GmMlLx2zWEZWqRb-aqt9BtYylT638onagS7zRMYxvxBw4iyAoRkmE6ysSwJptJWQJx6UaPuVzxk8A49T6oRMR9Axqukz2_xASmMW7TBe47ABkrb2jrxA4PyBGUmKN5lqkwDJ-Ow9pNq5pfVejhaAsb8vu4sMcRkM1rXKyViDp0lGRx4OyNLO9NBCzOwkKf9rtq6fk2xQlXc9zKvES-_P"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">AI Assistant</p>
                      <p className="text-[10px] opacity-80">Đang hoạt động</p>
                    </div>
                    <span className="material-symbols-outlined ml-auto text-sm">close</span>
                  </div>
                  {/* Chat Area */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 mt-1 shrink-0"></div>
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none text-[11px] shadow-sm text-on-surface leading-relaxed max-w-[80%]">
                        Xin chào! Tôi có thể giúp gì cho bạn?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-primary text-on-primary p-3 rounded-2xl rounded-tr-none text-[11px] shadow-sm leading-relaxed max-w-[80%]">
                        Tôi muốn hỏi về chính sách bảo mật của ứng dụng.
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 mt-1 shrink-0"></div>
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none text-[11px] shadow-sm text-on-surface leading-relaxed max-w-[80%]">
                        Dạ, chính sách bảo mật của chúng tôi cam kết bảo vệ dữ liệu người dùng 100%...
                      </div>
                    </div>
                  </div>
                  {/* Input Area */}
                  <div className="p-3 border-t border-slate-100 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-[10px] text-slate-400">
                      Nhập tin nhắn...
                    </div>
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-sm">send</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-on-surface-variant mt-6 italic">
                * Một số yếu tố giao diện có thể thay đổi tùy thuộc vào trình duyệt của khách hàng.
              </p>
            </div>
          </div>
        </div>

        {/* Embed Code Section */}
        <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden shadow-sm mt-8">
          <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">code</span>
              <h3 className="text-sm font-bold">Mã nhúng (Embed Code)</h3>
            </div>
            <button className="flex items-center gap-2 text-primary font-bold text-xs hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors">
              <span className="material-symbols-outlined text-sm">content_copy</span>
              Sao chép mã
            </button>
          </div>
          <div className="p-8 grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-slate-900 rounded-xl p-6 font-mono text-xs text-indigo-300 leading-relaxed overflow-x-auto shadow-inner">
                <span className="text-slate-500">{"<!-- AI Chatbot Widget -->"}</span>
                <br />
                <span className="text-indigo-400">{"<script"}</span> <span className="text-cyan-400">src</span>=
                <span className="text-amber-300">{"\"https://cdn.aichatbot.com/widget.js\""}</span>
                <br />
                {"        "}
                <span className="text-cyan-400">{"data-api-key"}</span>=
                <span className="text-amber-300">{"\"pk_live_123456789\""}</span>
                <span className="text-indigo-400">{"></script>"}</span>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Hướng dẫn cài đặt
              </h4>
              <ol className="space-y-4">
                {[
                  "Sao chép đoạn mã script ở bên trái.",
                  "Dán vào phần cuối của thẻ <body> trong file HTML của bạn.",
                  "Lưu lại và làm mới trang web để xem kết quả.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-xs text-on-surface-variant">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Bot Personality */}
        <div className="bg-surface-container-low p-8 rounded-xl mt-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">psychology</span>
            <h3 className="text-lg font-bold">Tính cách của Bot (Bot Personality)</h3>
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block">
              System Prompt
            </span>
            <textarea
              className="w-full bg-surface-container-lowest border-none rounded-xl p-5 text-sm leading-relaxed focus:ring-1 focus:ring-primary transition-all shadow-sm"
              placeholder="Nhập tính cách, quy tắc và nhiệm vụ của Bot tại đây..."
              rows={6}
              defaultValue="Bạn là một trợ lý AI chuyên nghiệp và thân thiện. Nhiệm vụ của bạn là hỗ trợ khách hàng trả lời các câu hỏi về sản phẩm của Kỷ nguyên Hội thoại. Hãy luôn giữ thái độ lịch sự, trả lời ngắn gọn và đi thẳng vào vấn đề. Nếu không biết câu trả lời, hãy hướng dẫn khách hàng để lại thông tin liên hệ."
            />
            <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
              <span>Sử dụng {"{{name}}"} để tham chiếu tên bot.</span>
              <span>Độ dài: 245 ký tự</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
