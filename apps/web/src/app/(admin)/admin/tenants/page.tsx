export default function AdminTenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Khách hàng (Tenants)</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
          + Thêm Tenant
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tên / Công ty</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email quản trị</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Slug</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr className="hover:bg-slate-50">
              <td className="px-6 py-4 font-semibold text-slate-800">Công ty Antigravity</td>
              <td className="px-6 py-4 text-slate-600">admin@antigravity.vn</td>
              <td className="px-6 py-4 font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block mt-3">antigravity-demo</td>
              <td className="px-6 py-4">
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">Active</span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold mr-3">Sửa</button>
                <button className="text-red-600 hover:text-red-900 text-sm font-semibold">Khóa</button>
              </td>
            </tr>
            {/* Thêm các rows mẫu khác nếu cần */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
