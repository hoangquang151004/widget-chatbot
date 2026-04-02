export default function OverviewPage() {
  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Tổng quan hệ thống</h2>
        <p className="text-on-surface-variant max-w-2xl">
          Theo dõi hiệu suất và hoạt động của AI Chatbot trong thời gian thực.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Tổng hội thoại", value: "12,842", change: "+12%", icon: "forum", color: "primary" },
          { label: "Tin nhắn AI", value: "45,210", change: "+18%", icon: "smart_toy", color: "indigo" },
          { label: "Tỷ lệ giải quyết", value: "94.2%", change: "+2%", icon: "check_circle", color: "green" },
          { label: "Thời gian phản hồi", value: "0.42s", change: "-0.05s", icon: "bolt", color: "amber" },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-${stat.color} text-2xl`}>{stat.icon}</span>
              </div>
              <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-indigo-600'} bg-slate-50 px-2 py-1 rounded-lg`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface-variant mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-on-surface">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Chart Placeholder */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-slate-100 shadow-sm h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">Lưu lượng hội thoại</h3>
              <select className="bg-slate-50 border-none rounded-lg text-xs font-bold px-4 py-2 focus:ring-2 focus:ring-primary/20">
                <option>7 ngày qua</option>
                <option>30 ngày qua</option>
              </select>
            </div>
            <div className="flex-1 w-full bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">monitoring</span>
                <p className="text-sm text-slate-400 font-medium">Biểu đồ đang được tải dữ liệu...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="lg:col-span-4">
          <div className="bg-surface-container-lowest p-8 rounded-2xl border border-slate-100 shadow-sm h-[400px] flex flex-col">
            <h3 className="text-lg font-bold mb-6">Hội thoại gần đây</h3>
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-400 text-xl">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">Khách hàng #{1000 + item}</p>
                    <p className="text-xs text-on-surface-variant truncate">Cần hỗ trợ về chính sách hoàn tiền...</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter shrink-0">2m ago</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-colors">
              Xem tất cả
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
