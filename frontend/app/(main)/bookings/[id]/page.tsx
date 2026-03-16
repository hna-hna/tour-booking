"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface OrderDetail {
  id: number;
  status: string;
  total_price: number;
  guest_count: number;
  booking_date: string;
  tour: {
    id: number;
    name: string;
    image: string;
    itinerary: string;
    price_per_person: number;
  };
  payment: {
    method: string;
    transaction_id: string;
    payment_date: string;
  };
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const fetchOrderDetails = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        alert(err.response?.data?.error || "Lỗi tải thông tin đơn hàng hoặc bạn không có quyền xem.");
        router.push("/bookings");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [params.id, router]);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không? Tiền sẽ được hoàn lại vào tài khoản của bạn theo chính sách.")) return;
    
    setCanceling(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://127.0.0.1:5000/api/orders/${order.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Hủy đơn hàng thành công!");
      fetchOrderDetails(); // Tải lại chi tiết
    } catch (error: any) {
      console.error("Lỗi khi hủy đơn:", error);
      alert(error.response?.data?.error || "Không thể hủy đơn hàng lúc này.");
    } finally {
      setCanceling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold rounded-full text-xs tracking-wider uppercase border border-amber-200 shadow-sm">Chờ xử lý</span>;
      case "paid": return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs tracking-wider uppercase border border-emerald-200 shadow-sm">Đã thanh toán</span>;
      case "cancelled": return <span className="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-full text-xs tracking-wider uppercase border border-rose-200 shadow-sm">Đã hủy</span>;
      case "completed": return <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-xs tracking-wider uppercase border border-blue-200 shadow-sm">Thành công</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-full text-xs tracking-wider uppercase shadow-sm">{status}</span>;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-emerald-800 font-medium">Đang tải chi tiết đơn hàng...</p>
    </div>
  );

  if (!order) return null;

  const isWithin24h = new Date().getTime() - new Date(order.booking_date).getTime() <= 24 * 3600 * 1000;
  const canCancel = ["pending", "paid", "Đã thanh toán"].includes(order.status) && isWithin24h;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Nút quay lại */}
        <div className="mb-6">
          <Link href="/bookings" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold transition group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Tất cả đơn hàng
          </Link>
        </div>

        {/* Khung chính */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header Đơn hàng */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-emerald-400 font-bold text-sm tracking-widest uppercase mb-1">Chi tiết hóa đơn</p>
              <h1 className="text-3xl font-black">Mã đơn: #{order.id.toString().padStart(6, '0')}</h1>
              <p className="text-slate-300 mt-2 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {new Date(order.booking_date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
              </p>
            </div>
            <div>
              {getStatusBadge(order.status)}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Cột Trái - Thông tin Tour */}
            <div className="lg:w-2/3 p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                Tour đã đặt
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-6 mb-8 group">
                <div className="w-full sm:w-48 h-32 rounded-2xl overflow-hidden shrink-0 shadow-md">
                   <img 
                      src={order.tour.image ? `http://127.0.0.1:5000/static/uploads/${order.tour.image}` : "https://via.placeholder.com/400x300"} 
                      alt={order.tour.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                   />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{order.tour.name}</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 font-semibold mb-3">
                     <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     Số lượng khách: <span className="text-emerald-600">{order.guest_count} người</span>
                  </div>
                  <p className="text-slate-500 text-sm">{order.tour.itinerary}</p>
                </div>
              </div>

              {/* Box Hướng dẫn hủy */}
              <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-orange-800 text-sm mb-1">Chính sách hủy tour</h4>
                  <p className="text-xs text-orange-700 leading-relaxed">Bạn sẽ nhận được khoản tiền hoàn lại đầy đủ cho lịch trình nếu hủy trong vòng 24 giờ kể từ khi thanh toán thành công. Sau thời gian này, đơn hàng sẽ không thể hủy.</p>
                </div>
              </div>
            </div>

            {/* Cột Phải - Thanh toán */}
            <div className="lg:w-1/3 bg-slate-50 p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  Thanh toán
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Giá mỗi khách</span>
                    <span className="font-bold text-slate-800">{order.tour.price_per_person.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-500">Số lượng khách</span>
                    <span className="font-bold text-slate-800">x {order.guest_count}</span>
                  </div>
                  
                  <div className="h-px bg-slate-200 my-2 w-full border-dashed border-t border-slate-300"></div>
                  
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-slate-600">Tổng cộng</span>
                    <span className="text-3xl font-black text-emerald-600">{order.total_price.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100 text-sm space-y-3 shadow-sm mb-8">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phương thức</span>
                    <span className="font-semibold text-slate-800 uppercase">{order.payment.method}</span>
                  </div>
                  {order.payment.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã giao dịch</span>
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-1 py-0.5 rounded">{order.payment.transaction_id.slice(0,12)}...</span>
                    </div>
                  )}
                  {order.payment.payment_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ngày TT</span>
                      <span className="font-medium text-slate-800">{new Date(order.payment.payment_date).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nút hành động */}
              <div>
                {canCancel ? (
                  <button 
                    onClick={handleCancel}
                    disabled={canceling}
                    className="w-full py-4 text-center rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition shadow-lg hover:shadow-xl hover:shadow-rose-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {canceling ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Hủy đơn & Hoàn tiền ngay"
                    )}
                  </button>
                ) : (
                   <button 
                     disabled
                     className="w-full py-4 text-center rounded-xl bg-slate-200 text-slate-400 font-bold cursor-not-allowed"
                   >
                     {order.status === 'cancelled' ? 'Đơn hàng đã hủy' : 'Hết hạn hủy miễn phí'}
                   </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
