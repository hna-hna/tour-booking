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
        console.error("Lỗi:", e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchOrders();
  }, []);

  const totalRevenue = orders
    .filter(o => ['paid', 'đã thanh toán'].includes(o.status.toLowerCase()))
    .reduce((sum, o) => sum + o.total_price, 0);

  const pendingOrders = orders.filter(o => 
    ['pending', 'chờ xử lý'].includes(o.status.toLowerCase())
  ).length;

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <div className="header">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Doanh thu & Đơn hàng</h1>
        <p className="text-gray-500 font-bold italic mt-1 text-sm">Quản lý dòng tiền và trạng thái dịch vụ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
          <div className="absolute right-[-10%] top-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Tổng doanh thu thực</p>
          <p className="text-4xl font-black mt-4">{totalRevenue.toLocaleString()} <span className="text-sm">đ</span></p>
          <div className="mt-6 inline-block bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase">
            Paid Only
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Đơn chờ xử lý</p>
          <p className="text-4xl font-black text-amber-500 mt-4">{pendingOrders}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-4 uppercase italic">Yêu cầu phản hồi ngay</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Quy mô hệ thống</p>
          <p className="text-4xl font-black text-gray-800 mt-4">{orders.length}</p>
          
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã đơn</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Khách hàng</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tour / Số lượng</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => {
                const isPaid = ['paid', 'đã thanh toán'].includes(order.status.toLowerCase());
                return (
                  <tr key={order.id} className="hover:bg-blue-50/10 transition-all group">
                    <td className="px-8 py-6 font-mono text-[10px] text-gray-400">#{order.id}</td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-800">{order.customer_name}</p>
                      <p className="text-[10px] font-bold text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-800 line-clamp-1">{order.tour_name}</p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">{order.guest_count} Hành khách</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        isPaid ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}