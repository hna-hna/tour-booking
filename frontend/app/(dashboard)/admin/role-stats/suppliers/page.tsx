"use client";
import React, { useEffect, useState } from 'react';

export default function SupplierStatsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/admin/role-stats");
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center font-bold text-indigo-600 animate-pulse uppercase tracking-[0.2em]">Đang truy xuất dữ liệu nhà cung cấp...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6 no-print">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Thống kê Nhà cung cấp</h1>
          <p className="text-slate-500 font-bold italic mt-2 text-sm italic">Báo cáo hiệu suất tour và doanh số theo từng nhà cung cấp</p>
        </div>
        <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-slate-800 transition-all font-black text-sm tracking-widest flex items-center gap-2 uppercase">
          Tải báo cáo (PDF)
        </button>
      </div>

      <div className="space-y-12">
        {/* Supplier Section */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-indigo-50/50 p-10 border-b border-slate-100 flex justify-between items-center relative overflow-hidden group">
            <div className="absolute right-[-5%] top-[-10%] w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl group-hover:scale-150 transition-all"></div>
            <div>
              <h2 className="text-2xl font-black text-indigo-800 flex items-center gap-3">
                <span className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-xl font-bold">S</span>
                Đối tác cung ứng Tour
              </h2>
              <p className="text-sm text-indigo-600/80 mt-1 font-black italic uppercase tracking-tighter">Hệ thống đối tác chiến lược</p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tổng đối tác</p>
              <p className="text-4xl font-black text-indigo-800 tracking-tighter leading-none mt-1">{data?.suppliers?.length || 0}</p>
            </div>
          </div>
          <div className="p-10 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="pb-8">Thông tin nhà cung cấp</th>
                  <th className="pb-8 text-center px-10">Lượng tour xuất bản</th>
                  <th className="pb-8 pl-10">Danh mục Tour đăng bán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.suppliers?.length > 0 ? data.suppliers.map((sup: any) => (
                  <tr key={sup.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-8">
                      <p className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{sup.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic mt-1">{sup.email}</p>
                    </td>
                    <td className="py-8 text-center px-10">
                      <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-xl px-6 py-2 rounded-2xl font-black shadow-inner">
                        {sup.total_tours}
                      </span>
                    </td>
                    <td className="py-8 pl-10 text-sm text-slate-600 max-w-lg">
                      <div className="flex flex-wrap gap-2">
                        {sup.tours?.map((t:string, idx:number) => (
                          <span key={idx} className="bg-white border-2 border-slate-50 px-4 py-1.5 rounded-xl text-[10px] font-black text-slate-600 shadow-sm hover:border-indigo-400 hover:text-indigo-600 cursor-default transition-all uppercase tracking-tighter italic">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-20 text-center text-slate-400 italic font-black text-lg">Chưa có dữ liệu từ các nhà cung cấp</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
