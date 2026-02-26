'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // --- STATE KẾT NỐI BACKEND ---
  const [statsData, setStatsData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenueByTour, setRevenueByTour] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Gọi API Tổng quan
        const resStats = await fetch("http://127.0.0.1:5000/api/admin/dashboard/stats");
        const dataStats = await resStats.json();
        setStatsData(dataStats);

        // 2. Gọi API đơn hàng (lấy 5 đơn mới nhất)
        const resOrders = await fetch("http://127.0.0.1:5000/api/admin/orders");
        const dataOrders = await resOrders.json();
        setOrders(dataOrders.slice(0, 5)); 

        // 3. Gọi API Doanh thu theo tour
        const resRevenue = await fetch("http://127.0.0.1:5000/api/admin/dashboard/revenue-by-tour");
        const dataRevenue = await resRevenue.json();
        setRevenueByTour(dataRevenue);
      } catch (error) {
        console.error("Lỗi kết nối API:", error);
      }
    };
    fetchData();
  }, []);

  // Xử lý mảng stats (Gộp chỉ số từ cả 2 nhánh)
  const stats = [
    { 
      title: "Tổng Doanh Thu", 
      value: statsData ? `${statsData.total_revenue?.toLocaleString() || 0}đ` : "0đ", 
      change: "GMV", 
      icon: "",
      color: "from-green-500 to-emerald-600"
    },
    { 
      title: "Lợi Nhuận (15%)", 
      value: statsData ? `${statsData.admin_commission?.toLocaleString() || 0}đ` : "0đ", 
      change: "Hoa hồng",
      icon: "",
      color: "from-orange-500 to-red-600"
    },
    { 
      title: "Đơn Hàng Mới", 
      value: statsData ? statsData.total_orders.toString() : "0", 
      change: "Tháng này",
      icon: "",
      color: "from-blue-500 to-indigo-600"
    },
    { 
      title: "Khách Hàng", 
      value: statsData ? statsData.total_customers.toLocaleString() : "0", 
      change: "Tổng User",
      icon: "",
      color: "from-blue-500 to-indigo-600"
    },
    { 
      title: "Tour Chờ Duyệt", 
      value: statsData ? statsData.pending_tours.toString() : "0", 
      change: "Yêu cầu", 
      icon: "",
      color: "from-purple-500 to-violet-600"
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* 1. Phần Chào mừng */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Xin chào, Admin! 👋</h1>
        <p className="text-gray-500 mt-2">Đây là tình hình kinh doanh của hệ thống hôm nay.</p>
      </div>

      {/* 2. Các thẻ tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-2xl p-6 shadow-lg text-white bg-gradient-to-br ${stat.color} relative overflow-hidden transition-transform hover:scale-105`}>
            <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-6 -mt-6"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-lg text-2xl">
                  {stat.icon}
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20">
                  {stat.change}
                </span>
              </div>
              <p className="text-gray-100 text-sm font-medium mt-4">{stat.title}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Khu vực nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột trái: Đơn đặt tour gần đây */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Đơn đặt tour gần đây</h3>
            <Link href="/admin/orders" className="text-emerald-600 text-sm font-medium hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3">Tour</th>
                  <th className="pb-3 text-right">Giá trị</th>
                  <th className="pb-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length > 0 ? orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <div className="font-medium text-gray-800">{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.customer_email}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-600 max-w-[200px] truncate">{order.tour_name}</td>
                    <td className="py-4 font-bold text-gray-800 text-right">{order.total_price?.toLocaleString()}đ</td>
                    <td className="py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        order.status === 'Đã thanh toán' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400">Chưa có đơn hàng nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột phải: Lối tắt truy cập nhanh */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Truy cập nhanh</h3>
          <div className="space-y-4">
            <Link href="/admin/approve-tours" className="block p-4 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-xl">
                    🛎️
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Duyệt Tour</p>
                    <p className="text-xs text-gray-500">{statsData?.pending_tours || 0} tour đang chờ</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            <Link href="/admin/users" className="block p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-xl">
                    🛡️
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Quản lý Users</p>
                    <p className="text-xs text-gray-500">Thêm/Khóa tài khoản</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Thống kê Doanh thu theo Tour */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Doanh thu theo Tour</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                <th className="pb-3 px-4">Tour</th>
                <th className="pb-3 px-4 text-center">Số lượng đơn</th>
                <th className="pb-3 px-4 text-right">Tổng thanh toán</th>
                <th className="pb-3 px-4 text-right text-emerald-600">Phí nền tảng (15%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {revenueByTour.length > 0 ? (
                revenueByTour.map((tour: any) => (
                  <tr key={tour.tour_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-800">{tour.tour_name}</div>
                      <div className="text-xs text-gray-400">ID: {tour.tour_id}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-sm">
                        {tour.total_bookings}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-800">
                      {tour.total_revenue?.toLocaleString()}đ
                    </td>
                    <td className="py-4 px-4 text-right font-black text-emerald-600">
                      {tour.admin_commission?.toLocaleString()}đ
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Chưa có dữ liệu doanh thu
                  </td>
                </tr>
              )}
            </tbody>
            {revenueByTour.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2">
                <tr className="font-black text-gray-800">
                  <td className="py-4 px-4" colSpan={2}>TỔNG CỘNG</td>
                  <td className="py-4 px-4 text-right">
                    {revenueByTour.reduce((sum, tour) => sum + (tour.total_revenue || 0), 0).toLocaleString()}đ
                  </td>
                  <td className="py-4 px-4 text-right text-emerald-600">
                    {revenueByTour.reduce((sum, tour) => sum + (tour.admin_commission || 0), 0).toLocaleString()}đ
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