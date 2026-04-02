export default function BillingPage() {
  return (
    <>
      {/* Section 1: Usage Overview */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Tổng quan sử dụng</h2>
            <p className="text-on-surface-variant text-sm">Chu kỳ thanh toán hiện tại: 01/10 - 31/10</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary-container/10 text-primary text-xs font-bold border border-primary/20">
            Cập nhật 5 phút trước
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Tin nhắn AI", current: "8,450", max: "10,000", percent: 84.5, icon: "chat_bubble", color: "primary" },
            { label: "Lưu trữ RAG", current: "45MB", max: "100MB", percent: 45, icon: "database", color: "tertiary-container" },
            { label: "Kết nối SQL", current: "1", max: "2", percent: 50, icon: "hub", color: "secondary" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm transition-all hover:border-primary/20"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 bg-${stat.color}/10 text-${stat.color} rounded-lg`}>
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
                <span className="text-xs font-bold text-on-surface-variant">{stat.percent}%</span>
              </div>
              <h3 className="text-on-surface font-semibold mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold text-on-surface mb-4">
                {stat.current} <span className="text-sm font-normal text-on-surface-variant">/ {stat.max}</span>
              </p>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div
                  className={`bg-${stat.color} h-full rounded-full`}
                  style={{ width: `${stat.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Plan Selection */}
      <section className="mb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-on-surface mb-3">Nâng tầm trải nghiệm AI của bạn</h2>
          <p className="text-on-surface-variant">
            Chọn gói dịch vụ phù hợp để mở khóa các tính năng nâng cao và tối ưu hóa quy trình làm việc.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Plan */}
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 flex flex-col transition-all hover:translate-y-[-4px]">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-on-surface mb-2">Free</h3>
              <p className="text-on-surface-variant text-sm h-10">Dành cho cá nhân bắt đầu tìm hiểu về AI.</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-on-surface">$0</span>
                <span className="text-on-surface-variant">/tháng</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {["1,000 tin nhắn/tháng", "10MB Lưu trữ RAG"].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  {f}
                </li>
              ))}
              <li className="flex items-center gap-3 text-sm text-on-surface-variant opacity-50">
                <span className="material-symbols-outlined text-sm">cancel</span>
                Kết nối SQL Database
              </li>
            </ul>
            <button className="w-full py-3 px-6 rounded-full border-2 border-outline-variant text-on-surface font-semibold hover:bg-surface-container transition-colors">
              Gói hiện tại
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-primary p-[2px] rounded-2xl shadow-2xl shadow-primary/20 transform scale-105 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-primary/10">
              Gợi ý
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-[22px] h-full flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-on-surface mb-2">Pro</h3>
                <p className="text-on-surface-variant text-sm h-10">
                  Giải pháp chuyên nghiệp cho doanh nghiệp vừa và nhỏ.
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-primary">$49</span>
                  <span className="text-on-surface-variant">/tháng</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "10,000 tin nhắn/tháng",
                  "100MB Lưu trữ RAG",
                  "2 Kết nối SQL Database",
                  "Hỗ trợ ưu tiên 24/7",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 px-6 rounded-full bg-primary text-on-primary font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all">
                Nâng cấp lên Pro
              </button>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 flex flex-col transition-all hover:translate-y-[-4px]">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-on-surface mb-2">Enterprise</h3>
              <p className="text-on-surface-variant text-sm h-10">
                Quy mô lớn với yêu cầu bảo mật và hiệu suất tối đa.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-on-surface">Tùy chỉnh</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {["Không giới hạn tin nhắn", "Lưu trữ RAG theo nhu cầu", "Tích hợp On-premise"].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 px-6 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors">
              Liên hệ kinh doanh
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-16">
        {/* Section 3: Payment Methods */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Phương thức thanh toán</h2>
            <button className="text-primary font-semibold text-sm hover:underline">Thêm thẻ mới</button>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-surface-container rounded flex items-center justify-center p-1">
                    <img
                      alt="Visa Logo"
                      className="h-4 object-contain"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFUESDSYC67gvZRoiWKFl8A5SZ8K2EdiqGTXGPUhs8LXt8sB8bGENh-x_h4fwJbOLw-riAEEJEHEtB7hArEg3z_mCj_Nmcw0gGW48JhPph5aOdMO0k6yVSgO2g4sPvPqeBet0nCR7Mglv48eH2VH8zuLhvwWlxAeeOcy40Z1CBahVSU32NFzorb8lPH4oZHUCO5Vee41JtnVdTMaZ-kFMN1hKB9YRho72tjZhkTji69GMIESauAfEd_zsZqmKhgxsmMPec4ovyAIK7"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Visa kết thúc bằng •••• 4242</p>
                    <p className="text-xs text-on-surface-variant">Hết hạn vào 12/26</p>
                  </div>
                </div>
                <span className="bg-secondary-container/50 text-secondary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Mặc định
                </span>
              </div>
              <div className="space-y-4">
                <div className="bg-surface-container-high/50 p-4 rounded-xl border border-transparent focus-within:border-primary/30 transition-all">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span className="text-xs font-medium uppercase tracking-tighter">Số thẻ</span>
                    <span className="material-symbols-outlined text-sm">lock</span>
                  </div>
                  <div className="mt-1 text-lg font-medium tracking-[0.2em] text-on-surface/70">
                    **** **** **** 4242
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-surface-container-high/50 p-4 rounded-xl border border-transparent">
                    <span className="text-xs font-medium uppercase tracking-tighter text-on-surface-variant">
                      Ngày hết hạn
                    </span>
                    <div className="mt-1 text-on-surface/70">12 / 26</div>
                  </div>
                  <div className="w-24 bg-surface-container-high/50 p-4 rounded-xl border border-transparent">
                    <span className="text-xs font-medium uppercase tracking-tighter text-on-surface-variant">CVC</span>
                    <div className="mt-1 text-on-surface/70">***</div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-4">
                <button className="flex-1 py-2.5 rounded-full text-xs font-bold text-slate-500 bg-surface-container hover:bg-surface-container-high transition-colors">
                  Gỡ bỏ
                </button>
                <button className="flex-1 py-2.5 rounded-full text-xs font-bold text-on-primary bg-primary hover:opacity-90 transition-opacity">
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Billing History */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">Lịch sử giao dịch</h2>
            <button className="text-slate-500 font-semibold text-sm hover:text-on-surface flex items-center gap-1">
              Xem tất cả
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    ID Hóa đơn
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    Ngày
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    Số tiền
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {[1, 2, 3].map((inv) => (
                  <tr key={inv} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-on-surface">INV-2023-00{inv}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-[10px] text-green-600 font-bold uppercase">Đã thanh toán</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">01 Th10, 2023</td>
                    <td className="px-6 py-4 text-sm font-bold text-on-surface">$49.00</td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-primary hover:bg-primary/5 rounded-full transition-all flex items-center gap-2 text-xs font-bold">
                        <span className="material-symbols-outlined text-sm">download</span>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Support CTA Banner */}
      <div className="mt-20 bg-surface-container-low p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-outline-variant/10">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined">support_agent</span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface">Cần hỗ trợ về thanh toán?</h3>
            <p className="text-sm text-on-surface-variant">Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp thắc mắc của bạn.</p>
          </div>
        </div>
        <button className="bg-white border-2 border-outline-variant text-on-surface px-6 py-3 rounded-full font-bold hover:bg-surface-container transition-all">
          Gửi yêu cầu hỗ trợ
        </button>
      </div>
    </>
  );
}
