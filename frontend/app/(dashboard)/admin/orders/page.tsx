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
        const res = await fetch('http://127.0.0.1:5000/api/admin/orders');
        const data = await res.json();
        setOrders(data);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  // Tính tổng doanh thu giả định (từ đơn Paid)
  const totalRevenue = orders
    .filter(o => o.status.toLowerCase() === 'paid')
    .reduce((sum, o) => sum + o.total_price, 0);
  
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Hàm style cho badge trạng thái
  const getStatusStyle = (status: string) => {
    switch(status.toLowerCase()) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) return <div className="p-10 text-center text-emerald-600 font-bold">Đang tải đơn hàng...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Doanh thu & Đơn hàng</h1>
          <p className="text-gray-500 mt-2">Quản lý các giao dịch booking trong hệ thống</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2 text-sm font-medium">
          <span></span> Xuất báo cáo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100">
          <p className="opacity-90 text-sm font-medium">Tổng doanh thu</p>
          <p className="text-3xl font-bold mt-2">{totalRevenue.toLocaleString()} đ</p>
          <div className="mt-4 text-xs bg-white/20 inline-block px-2 py-1 rounded"> Đã thanh toán</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Đơn chờ xử lý</p>
          <p className="text-3xl font-bold text-amber-500 mt-2">{pendingOrders}</p>
          <p className="text-xs text-gray-400 mt-1">Cần duyệt sớm</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Tổng đơn hàng</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{orders.length}</p>
          <p className="text-xs text-gray-400 mt-1">Toàn thời gian</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tour Booking</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-500">#{order.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800 line-clamp-1 max-w-xs" title={order.tour_name}>{order.tour_name}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{order.guest_count} khách</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-800">{order.total_price.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">đ</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.booking_date}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                      {order.status.toUpperCase()}
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