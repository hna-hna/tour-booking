"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ShoppingCart, BarChart3 } from 'lucide-react';

export default function RoleStatsPage() {
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

  if (loading) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse">Đang chuẩn bị trung tâm báo cáo...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-8 no-print">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Trung tâm Báo cáo</h1>
          <p className="text-slate-500 font-bold italic mt-2 text-sm italic">Tổng hợp hiệu suất kinh doanh và quản trị hệ thống</p>
          
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
        <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-3 rounded-2xl shadow-xl hover:bg-slate-800 transition-all font-black text-sm tracking-widest flex items-center gap-2 uppercase">
          Tải báo cáo tổng quan
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-4">Doanh thu ròng</p>
          <h3 className="text-3xl font-black italic">{(statsData?.total_revenue || 0).toLocaleString()}đ</h3>
          {statsData?.revenue_change !== undefined && period !== 'all' && (
            <div className={`mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${statsData.revenue_change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {statsData.revenue_change >= 0 ? '▲' : '▼'} {Math.abs(statsData.revenue_change)}%
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Lợi nhuận (15%)</p>
          <h3 className="text-3xl font-black text-emerald-600 italic">{(statsData?.admin_commission || 0).toLocaleString()}đ</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Đang giữ cho NCC</p>
          <h3 className="text-3xl font-black text-blue-600 italic">{(statsData?.escrow_balance || 0).toLocaleString()}đ</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Tổng số đơn hàng</p>
          <h3 className="text-3xl font-black text-slate-900 italic">{(statsData?.total_orders || 0).toLocaleString()}</h3>
        </div>
      </div>

      {/* Role Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 no-print">
        <Link href="/admin/role-stats/customers" className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-emerald-300 transition-all duration-500 relative overflow-hidden">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Users size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase italic tracking-tighter">Khách hàng</h3>
          <p className="text-sm text-slate-400 font-bold mb-8 italic italic">Chi tiêu & Lịch sử trải nghiệm</p>
          <div className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">Xem chi tiết →</div>
        </Link>

        <Link href="/admin/role-stats/suppliers" className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all duration-500 relative overflow-hidden">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <ShoppingCart size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase italic tracking-tighter">Nhà cung cấp</h3>
          <p className="text-sm text-slate-400 font-bold mb-8 italic italic">Năng lực & Lượng Tour xuất bản</p>
          <div className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">Xem chi tiết →</div>
        </Link>

        <Link href="/admin/role-stats/guides" className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-amber-300 transition-all duration-500 relative overflow-hidden">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <BarChart3 size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase italic tracking-tighter">Hướng dẫn viên</h3>
          <p className="text-sm text-slate-400 font-bold mb-8 italic italic">Khối lượng công việc & Hiệu suất</p>
          <div className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em]">Xem chi tiết →</div>
        </Link>
      </div>

      {/* Summary Footer Section */}
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden mt-8 no-print">
         <div className="absolute right-[-5%] top-[-5%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-2 italic">Cộng đồng</p>
              <p className="text-4xl font-black tracking-tighter">{data?.customers?.length || 0} Khách</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2 italic">Đối tác</p>
              <p className="text-4xl font-black tracking-tighter">{data?.suppliers?.length || 0} NCC</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-2 italic">Đội ngũ</p>
              <p className="text-4xl font-black tracking-tighter">{data?.guides?.length || 0} HDV</p>
            </div>
         </div>
      </div>
    </div>
  );
}
