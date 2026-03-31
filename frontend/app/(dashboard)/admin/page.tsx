"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [statsData, setStatsData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenueByTour, setRevenueByTour] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tối ưu: Gọi tất cả API cùng lúc thay vì đợi từng cái một
        const [resStats, resOrders, resRevenue] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/admin/dashboard/stats"),
          fetch("http://127.0.0.1:5000/api/admin/orders"),
          fetch("http://127.0.0.1:5000/api/admin/dashboard/revenue-by-tour")
        ]);

        const dataStats = await resStats.json();
        const dataOrders = await resOrders.json();
        const dataRevenue = await resRevenue.json();

        setStatsData(dataStats);
        setOrders(dataOrders.slice(0, 5)); // Chỉ lấy 5 đơn mới nhất để hiển thị Dashboard
        setRevenueByTour(dataRevenue);
      } catch (error) {
        console.error("Lỗi kết nối API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center font-black text-emerald-600 animate-pulse uppercase tracking-[0.3em]">
        Đang tổng hợp dữ liệu hệ thống...
      </div>
    );
  }

  // Cấu trúc stats kết hợp màu sắc Gradient và dữ liệu từ API
  const stats = [
    { 
      title: "Tổng Doanh Thu", 
      value: statsData?.total_revenue, 
      label: "GMV", 
      color: "from-slate-900 to-slate-800" 
    },
    { 
      title: "Lợi Nhuận (15%)", 
      value: statsData?.admin_commission, 
      label: "Net Income", 
      color: "from-emerald-600 to-teal-700" 
    },
    { 
      title: "Đơn Hàng", 
      value: statsData?.total_orders, 
      label: "Total Orders", 
      color: "from-blue-600 to-indigo-700" 
    },
    { 
      title: "Khách Hàng", 
      value: statsData?.total_customers, 
      label: "Active Users", 
      color: "from-purple-600 to-fuchsia-700" 
    },
    { 
      title: "Chờ Duyệt", 
      value: statsData?.pending_tours, 
      label: "Pending Tours", 
      color: "from-amber-500 to-orange-600" 
    },
  ];

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Hệ thống quản trị</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 italic">Chào buổi sáng, Admin! Đây là hiệu suất kinh doanh hôm nay.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dữ liệu thời gian thực</p>
          <p className="text-sm font-bold text-emerald-600">{new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} p-6 rounded-[2rem] text-white shadow-xl hover:translate-y-[-5px] transition-all duration-300 relative overflow-hidden group`}>
            <div className="absolute right-[-10%] top-[-10%] w-20 h-20 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform"></div>
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-4">{s.title}</p>
            <h3 className="text-2xl font-black truncate">
              {s.title.includes("Thu") || s.title.includes("Nhuận") 
                ? `${s.value?.toLocaleString() || 0}đ` 
                : s.value?.toLocaleString() || 0}
            </h3>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[9px] font-black bg-white/20 px-2 py-1 rounded-lg uppercase tracking-tighter">{s.label}</span>
              <span className="text-[10px] opacity-50 font-bold italic">Realtime</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Đơn hàng mới nhất */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Đơn hàng mới nhất</h3>
            <Link href="/admin/orders" className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-emerald-600 uppercase border border-slate-100 hover:bg-emerald-50 transition-all shadow-sm">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="p-8">Khách hàng</th>
                  <th className="p-8">Tour</th>
                  <th className="p-8 text-right">Giá trị</th>
                  <th className="p-8 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.length > 0 ? orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-8">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">{order.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 italic">{order.customer_email}</p>
                    </td>
                    <td className="p-8 text-xs font-medium text-slate-600 italic truncate max-w-[180px]">{order.tour_name}</td>
                    <td className="p-8 text-right font-black text-slate-900 text-sm">{order.total_price?.toLocaleString()}đ</td>
                    <td className="p-8 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                        order.status === 'Paid' || order.status === 'Đã thanh toán' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic">Chưa có dữ liệu giao dịch</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Shortcut */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute left-[-20%] bottom-[-20%] w-40 h-40 bg-emerald-600/20 rounded-full blur-3xl"></div>
            <h3 className="font-black uppercase text-xs tracking-[0.2em] mb-8 opacity-50">Trung tâm điều hành</h3>
            <div className="space-y-4 relative z-10">
              <Link href="/admin/approve-tours" className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-600 transition-all group">
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">Duyệt Tour</p>
                  <p className="text-[9px] opacity-50 mt-1 uppercase font-bold">{statsData?.pending_tours || 0} yêu cầu chờ xử lý</p>
                </div>
                <span className="group-hover:translate-x-1 transition-transform text-emerald-400">→</span>
              </Link>
              <Link href="/admin/users" className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-blue-600 transition-all group">
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">Quản lý Users</p>
                  <p className="text-[9px] opacity-50 mt-1 uppercase font-bold">Cấp quyền & bảo mật</p>
                </div>
                <span className="group-hover:translate-x-1 transition-transform text-blue-400">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Analysis Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Phân tích doanh thu theo tour</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="p-8 px-10">Tour chi tiết</th>
                <th className="p-8 text-center">Lượt đặt</th>
                <th className="p-8 text-right">Tổng thanh toán</th>
                <th className="p-8 text-right text-emerald-600">Hoa hồng nền tảng (15%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {revenueByTour.length > 0 ? revenueByTour.map((tour) => (
                <tr key={tour.tour_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-8 px-10">
                    <p className="font-black text-slate-800 text-sm">{tour.tour_name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">ID: {tour.tour_id}</p>
                  </td>
                  <td className="p-8 text-center">
                    <span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black border border-slate-200">{tour.total_bookings}</span>
                  </td>
                  <td className="p-8 text-right font-bold text-slate-900 text-sm">{tour.total_revenue?.toLocaleString()}đ</td>
                  <td className="p-8 text-right font-black text-emerald-600 text-lg">{tour.admin_commission?.toLocaleString()}đ</td>
                </tr>
              )) : (
                 <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic">Không có dữ liệu phân tích</td></tr>
              )}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black">
              <tr>
                <td className="p-8 px-10 uppercase text-[10px] tracking-[0.2em]" colSpan={2}>Tổng kết dòng tiền hệ thống</td>
                <td className="p-8 text-right text-sm">
                  {revenueByTour.reduce((sum, t) => sum + (t.total_revenue || 0), 0).toLocaleString()}đ
                </td>
                <td className="p-8 text-right text-2xl text-emerald-400">
                  {revenueByTour.reduce((sum, t) => sum + (t.admin_commission || 0), 0).toLocaleString()}đ
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}