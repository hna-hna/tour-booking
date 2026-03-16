"use client";
import React, { useEffect, useState } from 'react';

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  tour_name: string;
  total_price: number;
  status: string;
  guest_count: number;
  booking_date: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/orders');
        const data = await res.json();
        setOrders(data);
      } catch (e) { 
        console.error("Lỗi khi tải đơn hàng:", e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchOrders();
  }, []);

  // Tính tổng doanh thu từ các đơn đã thanh toán thành công
  const totalRevenue = orders
    .filter(o => o.status.toLowerCase() === 'paid' || o.status.toLowerCase() === 'đã thanh toán')
    .reduce((sum, o) => sum + o.total_price, 0);

  // Đếm số đơn đang chờ xử lý
  const pendingOrders = orders.filter(o => 
    o.status.toLowerCase() === 'pending' || o.status.toLowerCase() === 'chờ xử lý'
  ).length;

  // Hàm định dạng màu sắc cho trạng thái đơn hàng
  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'đã thanh toán') 
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'pending' || s === 'chờ xử lý') 
      return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s === 'cancelled' || s === 'đã hủy') 
      return 'bg-red-50 text-red-600 border-red-100';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      <p className="text-emerald-600 font-bold uppercase tracking-widest">Đang tải dữ liệu đơn hàng...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Doanh thu & Đơn hàng</h1>
          <p className="text-gray-500 mt-2 font-medium italic">Báo cáo tình hình kinh doanh thời gian thực</p>
        </div>
        <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2 text-sm font-bold">
          📥 Xuất báo cáo (CSV)
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Card Doanh thu */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-emerald-200 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
          <p className="opacity-80 text-xs font-black uppercase tracking-widest">Tổng doanh thu</p>
          <p className="text-4xl font-black mt-3 tabular-nums leading-none">
            {totalRevenue.toLocaleString()} <span className="text-lg">đ</span>
          </p>
          <div className="mt-6 text-[10px] bg-white/20 backdrop-blur-md inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold uppercase">
             <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span> Chỉ tính đơn đã thanh toán
          </div>
        </div>

        {/* Card Đơn chờ */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Đơn chờ xử lý</p>
          <p className="text-4xl font-black text-amber-500 mt-3">{pendingOrders}</p>
          <p className="text-xs text-gray-400 mt-4 font-medium italic">Yêu cầu phản hồi ngay lập tức</p>
        </div>

        {/* Card Tổng đơn */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Toàn bộ đơn hàng</p>
          <p className="text-4xl font-black text-gray-900 mt-3">{orders.length}</p>
          <div className="mt-4 flex gap-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className="bg-emerald-500 w-2/3"></div>
             <div className="bg-amber-400 w-1/6"></div>
             <div className="bg-red-400 w-1/6"></div>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mã đơn</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Khách hàng</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thông tin Tour</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Giá trị</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ngày đặt</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-emerald-50/20 transition-all group">
                  <td className="px-8 py-6 font-mono text-xs text-gray-400">#{order.id}</td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {order.customer_name}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">{order.customer_email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-800 line-clamp-1 max-w-[250px]" title={order.tour_name}>
                      {order.tour_name}
                    </p>
                    <p className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">
                      👥 {order.guest_count} khách
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-gray-900">
                      {order.total_price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">đ</span>
                  </td>
                  <td className="px-8 py-6 text-xs text-gray-500 font-medium">
                    {order.booking_date}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}