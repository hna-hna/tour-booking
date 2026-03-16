'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
// Sử dụng Lucide React để đồng bộ icon với Layout
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Clock, 
  TrendingUp,
  ArrowRight
} from "lucide-react";

export default function AdminDashboardPage() {
  const [statsData, setStatsData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenueByTour, setRevenueByTour] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi đồng thời các API để tối ưu tốc độ load
        const [resStats, resOrders, resRevenue] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/admin/dashboard/stats"),
          fetch("http://127.0.0.1:5000/api/admin/orders"),
          fetch("http://127.0.0.1:5000/api/admin/dashboard/revenue-by-tour")
        ]);

        const dataStats = await resStats.json();
        const dataOrders = await resOrders.json();
        const dataRevenue = await resRevenue.json();

        setStatsData(dataStats);
        setOrders(dataOrders.slice(0, 5)); // Chỉ lấy 5 đơn mới nhất
        setRevenueByTour(dataRevenue);
      } catch (error) {
        console.error("Lỗi kết nối API Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { 
      title: "Tổng Doanh Thu", 
      value: statsData ? `${statsData.total_revenue?.toLocaleString()}đ` : "0đ", 
      change: "GMV", 
      icon: <DollarSign size={24} />,
      color: "from-emerald-500 to-teal-600"
    },
    { 
      title: "Lợi Nhuận (15%)", 
      value: statsData ? `${statsData.admin_commission?.toLocaleString()}đ` : "0đ", 
      change: "Net Profit",
      icon: <TrendingUp size={24} />,
      color: "from-orange-500 to-rose-600"
    },
    { 
      title: "Đơn Hàng", 
      value: statsData ? statsData.total_orders.toString() : "0", 
      change: "Tháng này",
      icon: <ShoppingBag size={24} />,
      color: "from-blue-500 to-indigo-600"
    },
    { 
      title: "Khách Hàng", 
      value: statsData ? statsData.total_customers.toLocaleString() : "0", 
      change: "Users",
      icon: <Users size={24} />,
      color: "from-cyan-500 to-blue-600"
    },
    { 
      title: "Chờ Duyệt", 
      value: statsData ? statsData.pending_tours.toString() : "0", 
      change: "Tours", 
      icon: <Clock size={24} />,
      color: "from-purple-500 to-violet-600"
    },
  ];

  if (loading) return <div className="p-10 text-center font-bold text-emerald-600 animate-pulse">Đang tổng hợp dữ liệu...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Welcome Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Xin chào, Như Quỳnh! 👋</h1>
        <p className="text-gray-500 mt-2 font-medium">Hôm nay hệ thống của bạn đang hoạt động rất tốt.</p>
      </div>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-[2rem] p-6 shadow-xl text-white bg-gradient-to-br ${stat.color} relative overflow-hidden transition-all hover:scale-105 hover:shadow-2xl group`}>
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center">
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                  {stat.icon}
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-black/10 uppercase tracking-tighter">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{stat.title}</p>
                <h3 className="text-2xl font-black mt-1 tabular-nums">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Recent Orders Table */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-gray-900 italic">Đơn đặt tour mới nhất</h3>
            <Link href="/admin/orders" className="flex items-center gap-2 text-emerald-600 text-sm font-bold hover:gap-3 transition-all">
              Tất cả đơn hàng <ArrowRight size={16} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                  <th className="pb-4">Khách hàng</th>
                  <th className="pb-4">Tour</th>
                  <th className="pb-4 text-right">Giá trị</th>
                  <th className="pb-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order: any) => (
                  <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-5">
                      <div className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{order.customer_name}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{order.customer_email}</div>
                    </td>
                    <td className="py-5 text-sm font-medium text-gray-600 max-w-[180px] truncate">{order.tour_name}</td>
                    <td className="py-5 font-black text-gray-900 text-right">{order.total_price?.toLocaleString()}đ</td>
                    <td className="py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        order.status === 'Đã thanh toán' || order.status === 'Paid' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
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

        {/* 4. Quick Actions & Access */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-8 italic">Phím tắt</h3>
            <div className="grid grid-cols-1 gap-4">
              <Link href="/admin/approve-tours" className="group flex items-center justify-between p-5 rounded-3xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm group-hover:rotate-12 transition-transform">🛎️</div>
                  <div>
                    <p className="font-black text-gray-900">Duyệt Tour</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">{statsData?.pending_tours || 0} yêu cầu mới</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-amber-300 group-hover:text-amber-600 transition-colors" />
              </Link>

              <Link href="/admin/users" className="group flex items-center justify-between p-5 rounded-3xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm group-hover:rotate-12 transition-transform">🛡️</div>
                  <div>
                    <p className="font-black text-gray-900">Quản lý Users</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Thiết lập quyền hạn</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-blue-300 group-hover:text-blue-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Revenue Analysis by Tour */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-2xl font-black text-gray-900 mb-8 italic">Phân tích Doanh thu theo Tour</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                <th className="pb-4 px-4">Tên Tour</th>
                <th className="pb-4 px-4 text-center">Số lượng đơn</th>
                <th className="pb-4 px-4 text-right">Tổng doanh thu</th>
                <th className="pb-4 px-4 text-right text-emerald-600 italic underline decoration-2">Phí nền tảng (15%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {revenueByTour.map((tour: any) => (
                <tr key={tour.tour_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-6 px-4">
                    <div className="font-black text-gray-900">{tour.tour_name}</div>
                    <div className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-tighter">UID: {tour.tour_id}</div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-900 rounded-xl font-black text-xs">
                      {tour.total_bookings}
                    </span>
                  </td>
                  <td className="py-6 px-4 text-right font-black text-gray-900">
                    {tour.total_revenue?.toLocaleString()}đ
                  </td>
                  <td className="py-6 px-4 text-right font-black text-emerald-600 text-lg">
                    {tour.admin_commission?.toLocaleString()}đ
                  </td>
                </tr>
              ))}
            </tbody>
            {revenueByTour.length > 0 && (
              <tfoot className="bg-emerald-50/50 border-t-4 border-white">
                <tr className="font-black text-gray-900">
                  <td className="py-6 px-6 rounded-l-[1.5rem]" colSpan={2}>TỔNG CỘNG HỆ THỐNG</td>
                  <td className="py-6 px-4 text-right text-xl italic underline decoration-double">
                    {revenueByTour.reduce((sum, t) => sum + (t.total_revenue || 0), 0).toLocaleString()}đ
                  </td>
                  <td className="py-6 px-6 text-right text-2xl text-emerald-700 rounded-r-[1.5rem]">
                    {revenueByTour.reduce((sum, t) => sum + (t.admin_commission || 0), 0).toLocaleString()}đ
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}