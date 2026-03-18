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
        const [resStats, resOrders, resRevenue] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/admin/dashboard/stats"),
          fetch("http://127.0.0.1:5000/api/admin/orders"),
          fetch("http://127.0.0.1:5000/api/admin/dashboard/revenue-by-tour")
        ]);

        const dataStats = await resStats.json();
        const dataOrders = await resOrders.json();
        const dataRevenue = await resRevenue.json();

        setStatsData(dataStats);
        setOrders(dataOrders.slice(0, 5)); 
        setRevenueByTour(dataRevenue);
      } catch (error) {
        console.error("Lỗi kết nối API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold text-emerald-600 animate-pulse uppercase tracking-widest">Đang tổng hợp dữ liệu...</div>;

  const stats = [
    { title: "Tổng Doanh Thu", value: statsData?.total_revenue, label: "GMV", color: "bg-slate-900" },
    { title: "Lợi Nhuận (15%)", value: statsData?.admin_commission, label: "Net", color: "bg-emerald-600" },
    { title: "Đơn Hàng", value: statsData?.total_orders, label: "Orders", color: "bg-slate-800" },
    { title: "Khách Hàng", value: statsData?.total_customers, label: "Users", color: "bg-slate-700" },
    { title: "Chờ Duyệt", value: statsData?.pending_tours, label: "Pending", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Hệ thống quản trị</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Báo cáo hiệu suất kinh doanh trực tuyến</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cập nhật mới nhất</p>
          <p className="text-sm font-bold text-emerald-600">{new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {/* Stats Cards - No Icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`${s.color} p-6 rounded-2xl text-white shadow-sm hover:translate-y-[-4px] transition-all duration-300`}>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-4">{s.title}</p>
            <h3 className="text-xl font-black truncate">
              {typeof s.value === 'number' && s.title.includes("Thu") || s.title.includes("Nhuận") 
                ? `${s.value.toLocaleString()}đ` 
                : s.value?.toLocaleString()}
            </h3>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded uppercase">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Đơn hàng mới nhất */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-wider">Đơn hàng mới nhất</h3>
            <Link href="/admin/orders" className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="p-6">Khách hàng</th>
                  <th className="p-6">Tour</th>
                  <th className="p-6 text-right">Giá trị</th>
                  <th className="p-6 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-slate-800 text-sm">{order.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{order.customer_email}</p>
                    </td>
                    <td className="p-6 text-xs font-medium text-slate-600 italic truncate max-w-[200px]">{order.tour_name}</td>
                    <td className="p-6 text-right font-black text-slate-900 text-sm">{order.total_price?.toLocaleString()}đ</td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                        order.status === 'Paid' || order.status === 'Đã thanh toán' 
                        ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phím tắt / Quick Actions */}
        <div className="space-y-4">
          <div className="bg-slate-900 p-6 rounded-3xl text-white">
            <h3 className="font-black uppercase text-xs tracking-widest mb-6 opacity-60">Thao tác nhanh</h3>
            <div className="space-y-3">
              <Link href="/admin/approve-tours" className="block p-4 rounded-xl bg-white/10 hover:bg-emerald-600 transition-all group">
                <p className="font-bold text-sm">Duyệt Tour</p>
                <p className="text-[10px] opacity-50 mt-1 uppercase">{statsData?.pending_tours || 0} yêu cầu đang chờ</p>
              </Link>
              <Link href="/admin/users" className="block p-4 rounded-xl bg-white/10 hover:bg-blue-600 transition-all">
                <p className="font-bold text-sm">Quản lý Users</p>
                <p className="text-[10px] opacity-50 mt-1 uppercase">Phân quyền hệ thống</p>
              </Link>
            </div>
          </div>
          
          
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-black text-slate-800 uppercase text-sm tracking-wider">Phân tích doanh thu theo sản phẩm</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="p-6">Tên Tour</th>
                <th className="p-6 text-center">Số lượng</th>
                <th className="p-6 text-right">Tổng thu</th>
                <th className="p-6 text-right text-emerald-600">Hoa hồng (15%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {revenueByTour.map((tour) => (
                <tr key={tour.tour_id} className="hover:bg-slate-50/50">
                  <td className="p-6 font-bold text-slate-800 text-sm">{tour.tour_name}</td>
                  <td className="p-6 text-center">
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black">{tour.total_bookings}</span>
                  </td>
                  <td className="p-6 text-right font-bold text-slate-900 text-sm">{tour.total_revenue?.toLocaleString()}đ</td>
                  <td className="p-6 text-right font-black text-emerald-600 text-base">{tour.admin_commission?.toLocaleString()}đ</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black">
              <tr>
                <td className="p-6 uppercase text-xs" colSpan={2}>Tổng kết hệ thống</td>
                <td className="p-6 text-right text-sm">
                  {revenueByTour.reduce((sum, t) => sum + (t.total_revenue || 0), 0).toLocaleString()}đ
                </td>
                <td className="p-6 text-right text-xl text-emerald-400">
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