"use client";

export default function TopAppBar() {
  return (
    <header className="docked full-width top-0 sticky z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm flex justify-between items-center px-6 h-16 w-full">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-sm">home</span>
          <span className="material-symbols-outlined text-slate-300 text-xs">chevron_right</span>
          <span className="text-xs font-medium text-slate-500">Dashboard</span>
          {/* Breadcrumb can be dynamic based on current route */}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            className="pl-10 pr-4 py-1.5 bg-slate-100/50 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary/20"
            placeholder="Tìm kiếm hệ thống..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors active:scale-95 duration-200 relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden ml-2 border border-slate-200">
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUHREaY2mPqYtw9D5BQ_NPS-4r5VarRL75-yonnU3k_yk1mswLC1npGdb0nnLMoNZx5NL4fj1_AMpmjVJ48UCcCaERXdWcQFJOHhWGBtyQZAlhfALPm4qkOoGPP3AUOh0FRyQos-zNW7FNNQV3NvB9o4hYBVkMy8APHb15bG0I0-TfMfI_NnIxU_pidctg21DcZxJjBmf8cst1N7_fVF4U_ZAmP2DSzjQFXPVVBxmO8kJkogFoRoGCEFeV368TAMt0aAJJpjwVN_lF"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
