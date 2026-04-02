export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Cấu hình Hệ thống</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-3xl">
        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">OpenAI API Key (Global Fallback)</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="sk-..."
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Giới hạn Request (Rate Limit Default)</label>
            <input 
              type="number" 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              defaultValue={100}
            />
            <p className="text-xs text-slate-500">Số request mỗi phút / tenant</p>
          </div>
          
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700">
            Lưu thay đổi
          </button>
        </form>
      </div>
    </div>
  );
}
