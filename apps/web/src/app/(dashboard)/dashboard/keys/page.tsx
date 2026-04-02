export default function ApiKeysPage() {
  return (
    <>
      {/* Hero Section / Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Quản lý API Key</h2>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Tạo và quản lý các khóa bí mật để tích hợp chatbot vào hệ thống của bạn một cách an toàn và hiệu quả.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all duration-200">
          <span className="material-symbols-outlined">add</span>
          <span>Tạo Key mới</span>
        </button>
      </div>

      {/* Bento Layout for Stats/Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined">key</span>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Hoạt động</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Tổng số Keys</p>
          <h4 className="text-2xl font-black text-slate-900">08</h4>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Hôm nay</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Yêu cầu gọi API</p>
          <h4 className="text-2xl font-black text-slate-900">12,402</h4>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined">shield</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Độ bảo mật</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-indigo-500"></div>
            </div>
            <span className="text-sm font-bold text-slate-700">75%</span>
          </div>
        </div>
      </div>

      {/* API Keys Table Container */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Danh sách API Keys</h3>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-sm">info</span>
            <span className="text-xs">Không chia sẻ Secret Key với bất kỳ ai.</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Key</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Public Key</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Secret Key</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: "Production", type: "live", pk: "pk_live_823j...9f2", icon: "rocket_launch", status: "Active" },
                { name: "Testing", type: "test", pk: "pk_test_412x...a34", icon: "science", status: "Active" },
                { name: "Old Integration", type: "live", pk: "pk_live_019a...7d1", icon: "history", status: "Revoked" },
              ].map((key, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 ${
                          key.status === "Active" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
                        } rounded flex items-center justify-center`}
                      >
                        <span className="material-symbols-outlined text-lg">{key.icon}</span>
                      </div>
                      <span className={`font-semibold ${key.status === "Active" ? "text-slate-900" : "text-slate-400"}`}>
                        {key.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code
                      className={`text-xs ${
                        key.status === "Active" ? "bg-slate-100 text-slate-600" : "bg-slate-50 text-slate-400"
                      } px-2 py-1 rounded`}
                    >
                      {key.pk}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${
                          key.status === "Active" ? "text-slate-400" : "text-slate-300"
                        } font-mono tracking-widest text-xs`}
                      >
                        {key.type}_**********
                      </span>
                      {key.status === "Active" ? (
                        <>
                          <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                          </button>
                        </>
                      ) : (
                        <button className="text-slate-300 cursor-not-allowed">
                          <span className="material-symbols-outlined text-sm">visibility_off</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        key.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${key.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                      {key.status === "Active" ? "Đang hoạt động" : "Đã thu hồi"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {key.status === "Active" ? (
                      <button className="text-slate-400 hover:text-error transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    ) : (
                      <button className="text-slate-300 hover:text-error transition-colors">
                        <span className="material-symbols-outlined">refresh</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Hiển thị 3 trên tổng số 8 API Keys</p>
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-primary text-white rounded">
              1
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-xs font-medium text-slate-600 hover:bg-white rounded">
              2
            </button>
            <button className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice Banner */}
      <div className="mt-8 bg-indigo-50 border border-indigo-100 p-6 rounded-xl flex gap-4 items-start">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
          <span className="material-symbols-outlined">verified_user</span>
        </div>
        <div>
          <h5 className="text-indigo-900 font-bold mb-1">Mẹo bảo mật tài khoản</h5>
          <p className="text-indigo-700 text-sm leading-relaxed">
            Đừng bao giờ chia sẻ API Key của bạn qua email hoặc tin nhắn. Sử dụng biến môi trường (environment
            variables) trong code của bạn và thường xuyên thay đổi (rotate) key để đảm bảo an toàn tối đa.
          </p>
        </div>
      </div>
    </>
  );
}
