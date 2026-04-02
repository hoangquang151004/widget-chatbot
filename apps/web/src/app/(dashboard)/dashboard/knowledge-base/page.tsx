export default function KnowledgeBasePage() {
  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
          Cơ sở kiến thức (RAG)
        </h2>
        <p className="text-on-surface-variant max-w-2xl">
          Quản lý và huấn luyện mô hình AI của bạn bằng cách tải lên các tài liệu nghiệp vụ. Hệ thống sẽ tự động phân tách và lập chỉ mục dữ liệu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-12 xl:col-span-8">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  cloud_upload
                </span>
                Tải lên tài liệu mới
              </h3>
              <span className="text-xs font-medium text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
                Tối đa 10MB/tệp
              </span>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
              </div>
              <p className="text-lg font-semibold mb-1">Kéo thả tệp tin hoặc click để tải lên</p>
              <p className="text-on-surface-variant text-sm">Hỗ trợ định dạng PDF, DOCX, TXT</p>
              <input className="hidden" type="file" />
            </div>

            {/* Active Uploading State */}
            <div className="mt-8 bg-surface-container-low rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-indigo-500">description</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Báo cáo chiến lược 2024.pdf</p>
                    <p className="text-[11px] text-on-surface-variant">4.2 MB • Đang tải lên...</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary">85%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full w-[85%] transition-all duration-1000"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-primary text-white rounded-xl p-6 shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold mb-1 opacity-90">Tổng dung lượng</h4>
              <div className="text-3xl font-black mb-4">12.5 GB / 50 GB</div>
              <div className="w-full bg-white/20 h-2 rounded-full mb-4">
                <div className="bg-white h-full rounded-full w-[25%]"></div>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Gói hiện tại của bạn cho phép lưu trữ tối đa 50GB dữ liệu tri thức chất lượng cao.
              </p>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-white/10 text-9xl">
              storage
            </span>
          </div>

          <div className="bg-surface-container-lowest border border-slate-100 rounded-xl p-6">
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-slate-400">
              Hướng dẫn nhanh
            </h4>
            <ul className="space-y-4">
              {[
                "Tải lên các tệp PDF hoặc Word chứa thông tin doanh nghiệp.",
                "Chờ hệ thống xử lý (OCR & Embedding) trong vài giây.",
                "Kiểm tra kết quả trong phần Chatbot Widget.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{step}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Document List Section */}
        <div className="lg:col-span-12">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-bold">Danh sách tài liệu</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    search
                  </span>
                  <input
                    className="pl-10 pr-4 py-2 bg-surface-container rounded-lg border-none text-sm w-full md:w-64 focus:ring-2 focus:ring-primary/20"
                    placeholder="Tìm kiếm tài liệu..."
                    type="text"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  <span>Lọc</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant uppercase text-[11px] font-bold tracking-widest">
                    <th className="px-6 py-4 w-12">
                      <input className="rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                    </th>
                    <th className="px-6 py-4">Tên file</th>
                    <th className="px-6 py-4">Kích thước</th>
                    <th className="px-6 py-4">Ngày tải lên</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Sample Rows */}
                  {[
                    { name: "Chính sách bảo mật.pdf", size: "1.2MB", date: "12/10/2023", status: "Thành công", color: "green", icon: "picture_as_pdf" },
                    { name: "Hướng dẫn sử dụng.docx", size: "800KB", date: "15/10/2023", status: "Đang xử lý", color: "amber", icon: "article" },
                    { name: "Dữ liệu khách hàng cũ.txt", size: "4.5MB", date: "05/10/2023", status: "Lỗi", color: "red", icon: "text_snippet" },
                  ].map((doc, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <input className="rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded bg-${doc.color}-50 flex items-center justify-center`}>
                            <span className={`material-symbols-outlined text-${doc.color}-500 text-[20px]`}>{doc.icon}</span>
                          </div>
                          <span className="text-sm font-semibold">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{doc.size}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{doc.date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${doc.color}-100 text-${doc.color}-700`}>
                          <span className={`w-1.5 h-1.5 rounded-full bg-${doc.color}-500 mr-1.5 ${doc.status === 'Đang xử lý' ? 'animate-pulse' : ''}`}></span>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button className="p-2 text-slate-400 hover:text-error hover:bg-error-container rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-surface-container-lowest border-t border-slate-100 flex items-center justify-between">
              <p className="text-[13px] text-on-surface-variant">Hiển thị 1-3 trong số 3 tài liệu</p>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded hover:bg-slate-50 disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white text-xs font-bold">1</button>
                <button className="p-2 rounded hover:bg-slate-50 disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group">
        <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform">add</span>
      </button>
    </>
  );
}
