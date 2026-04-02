export default function DatabasePage() {
  return (
    <>
      {/* Header Section */}
      <section className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Cấu hình Database (SQL)</h2>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Kết nối cơ sở dữ liệu của bạn để kích hoạt tính năng Text-to-SQL. AI sẽ tự động phân tích cấu trúc bảng và hỗ
          trợ truy vấn dữ liệu bằng ngôn ngữ tự nhiên.
        </p>
      </section>

      {/* Warning Alert */}
      <div className="bg-tertiary-fixed text-on-tertiary-fixed px-6 py-4 rounded-3xl flex items-start gap-4 border border-tertiary/10 mb-8">
        <span className="material-symbols-outlined text-tertiary mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>
          warning
        </span>
        <div>
          <p className="font-bold text-sm">Cảnh báo bảo mật quan trọng</p>
          <p className="text-sm opacity-90 mt-1">
            Chúng tôi chỉ thực hiện quyền SELECT để truy vấn dữ liệu. Hãy đảm bảo User DB của bạn được phân quyền giới
            hạn để bảo mật tối đa cho hệ thống của bạn.
          </p>
        </div>
      </div>

      {/* Connection Form & Schema Preview Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">power</span>
              Thiết lập kết nối
            </h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Loại Database
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["PostgreSQL", "MySQL", "SQL Server"].map((db) => (
                    <label key={db} className="cursor-pointer">
                      <input
                        defaultChecked={db === "PostgreSQL"}
                        className="hidden peer"
                        name="db_type"
                        type="radio"
                      />
                      <div className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-outline-variant/20 peer-checked:border-primary peer-checked:bg-primary/5 transition-all">
                        <span className="font-semibold text-sm">{db}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Host / IP
                </label>
                <input
                  className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="db.example.com"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Port</label>
                <input
                  className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="5432"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Tên Database
                </label>
                <input
                  className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="production_analytics"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Username
                </label>
                <input
                  className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="readonly_user"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="••••••••••••"
                    type="password"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant cursor-pointer text-[20px]">
                    visibility
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-4 mt-4">
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-full border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">sync</span>
                  Kiểm tra kết nối
                </button>
                <button
                  className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  type="submit"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Schema Preview Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-3xl h-full border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schema</span>
                Schema Preview
              </h3>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                Synced
              </span>
            </div>
            <div className="space-y-3">
              {[
                { name: "users", columns: ["id (integer)", "name (text)", "email (text)"] },
                { name: "orders", columns: ["id (integer)", "amount (decimal)", "date (timestamp)"] },
                { name: "products", columns: [], collapsed: true },
              ].map((table) => (
                <div
                  key={table.name}
                  className={`bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/20 ${
                    table.collapsed ? "opacity-60" : ""
                  }`}
                >
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-surface transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                        table
                      </span>
                      <span className="font-bold text-sm">{table.name}</span>
                    </div>
                    <span
                      className={`material-symbols-outlined text-on-surface-variant transition-transform ${
                        !table.collapsed ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {!table.collapsed && (
                    <div className="px-4 pb-4 space-y-2">
                      {table.columns.map((col, idx) => {
                        const [name, type] = col.split(" ");
                        return (
                          <div
                            key={idx}
                            className={`flex justify-between items-center text-xs py-1.5 ${
                              idx !== table.columns.length - 1 ? "border-b border-outline-variant/10" : ""
                            }`}
                          >
                            <span className="font-mono text-on-surface-variant">{name}</span>
                            <span className="text-primary-container font-semibold">{type.replace(/[()]/g, "")}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-[11px] text-primary font-bold uppercase tracking-widest mb-2">Trạng thái AI</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                AI đã sẵn sàng phân tích dữ liệu cho 3 bảng này. Mọi truy vấn sẽ được tối ưu hóa cho cấu trúc Schema
                hiện tại.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Decorative Backdrop Section */}
      <section className="mt-12 overflow-hidden rounded-3xl relative h-48 group">
        <img
          className="w-full h-full object-cover filter brightness-50 contrast-125 group-hover:scale-105 transition-transform duration-700"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-oBl0lqAtndnOX3ELDTy0stJoIz-wlIkfLAxa_wpvyyN60PGHbGbm3oA9_F3dhXWh3Px00rTWVCoRsBLFx1D0jnFfbuWB2o0e-bVVCqDeexC6LRQVj8raLX1INx8vyE34LgMxLeQMCjsS3lzvEmRjsbykLEquZdKnzImKTfPDgm7P15_IacGUiUQVe4CY4ZlAXDMuNxpQHfRTb3DsznxSJxcOFjiarMg1bxRqb0V58A0vNc5BMDthvhmE5V4wQ2kyHgQrcHRMBCKn"
          alt="Abstract decorative background"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center px-12">
          <div className="max-w-md">
            <h4 className="text-white text-xl font-bold mb-2">Khám phá sức mạnh của dữ liệu</h4>
            <p className="text-white/80 text-sm">
              Hệ thống Text-to-SQL cho phép bạn tạo ra báo cáo chỉ bằng cách đặt câu hỏi. Không cần code, không cần
              chuyên môn kỹ thuật cao.
            </p>
          </div>
        </div>
      </section>

      {/* FAB for AI Help */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          smart_toy
        </span>
      </button>
    </>
  );
}
