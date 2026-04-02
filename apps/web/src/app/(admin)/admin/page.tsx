export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống (Super Admin)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Tổng số Tenants</p>
          <p className="text-3xl font-black text-slate-800 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Tổng số Requests</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">1,245,000</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Active Widgets</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">8</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500">Lỗi hệ thống</p>
          <p className="text-3xl font-black text-red-600 mt-2">0</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 h-96 flex items-center justify-center">
        <p className="text-slate-400">Biểu đồ tải hệ thống sẽ hiển thị ở đây</p>
      </div>
    </div>
  );
}
