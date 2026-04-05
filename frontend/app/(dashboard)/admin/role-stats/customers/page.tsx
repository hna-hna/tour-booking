"use client";
import React, { useEffect, useState } from 'react';

export default function CustomerStatsPage() {
  const [data, setData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resRole, resStats] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/admin/role-stats"),
          fetch(`http://127.0.0.1:5000/api/admin/dashboard/stats?period=${period}`)
        ]);

        if (resRole.ok) setData(await resRole.json());
        if (resStats.ok) setStatsData(await resStats.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse">Đang bóc tách dữ liệu khách hàng...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6 no-print">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Thống kê Khách hàng</h1>
          <p className="text-slate-500 font-bold italic mt-2 text-sm">Báo cáo hoạt động đặt tour và chi tiêu của khách hàng</p>
          
          <div className="mt-6 flex items-center gap-4">
            <span className="text-[10px] font-black uppercase text-slate-400">Lọc tài chính:</span>
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-100 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm này</option>
            </select>
          </div>
        </div>
        <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-slate-800 transition-all font-black text-sm tracking-widest flex items-center gap-2">
          Xuất báo cáo (PDF)
        </button>
      </div>

      <div className="space-y-12">
        {/* Customer Section */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-emerald-50/50 p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-emerald-800 flex items-center gap-3">
                <span className="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-lg">C</span>
                Tất cả Khách hàng
              </h2>
              <p className="text-sm text-emerald-600/80 mt-1 font-medium italic">Danh sách chi tiết hành vi người tiêu dùng</p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tổng khách hàng</p>
              <p className="text-3xl font-black text-emerald-800 tracking-tighter">{data?.customers?.length || 0}</p>
            </div>
          </div>
          <div className="p-8 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-6">Họ tên & Email</th>
                  <th className="pb-6 text-center">Số chuyến book</th>
                  <th className="pb-6 text-right px-6">Tổng chi tiêu</th>
                  <th className="pb-6 pl-6">Tour đã trải nghiệm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.customers?.length > 0 ? data.customers.map((cus: any) => (
                  <tr key={cus.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-6">
                      <p className="font-black text-slate-800 text-sm">{cus.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono italic">{cus.email}</p>
                    </td>
                    <td className="py-6 text-center">
                      <span className="bg-slate-100 px-4 py-1.5 rounded-full text-xs font-black text-slate-600 border border-slate-200">
                        {cus.total_tours}
                      </span>
                    </td>
                    <td className="py-6 text-right px-6 font-black text-emerald-600 text-lg">
                      {cus.total_spent.toLocaleString()}đ
                    </td>
                    <td className="py-6 pl-6 text-sm text-slate-600 max-w-sm">
                      <div className="flex flex-wrap gap-2">
                        {cus.tours?.map((t:string, idx:number) => (
                          <span key={idx} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm">{t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-20 text-center text-slate-400 italic font-black text-lg">Chưa có dữ liệu giao dịch từ khách hàng</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
