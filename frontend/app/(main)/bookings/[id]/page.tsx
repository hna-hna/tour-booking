"use client";

import React, { useEffect, useState } from "react";
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
    start_date?: string;
    end_date?: string;
  };
  guide?: {
    id: number;
    full_name: string;
    email?: string;
    phone: string;
    license_number: string;
    years_of_experience: number;
    languages: string;
    specialties: string;
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
  const [showGuideModal, setShowGuideModal] = useState(false);

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
        alert(err.response?.data?.error || "Lỗi tải thông tin đơn hàng.");
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
      fetchOrderDetails();
    } catch (error: any) {
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
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/bookings" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold transition group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Tất cả đơn hàng
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-emerald-400 font-bold text-sm tracking-widest uppercase mb-1">Chi tiết hóa đơn</p>
              <h1 className="text-3xl font-black">Mã đơn: #{order.id.toString().padStart(6, '0')}</h1>
              <p className="text-slate-300 mt-2 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {new Date(order.booking_date).toLocaleString('vi-VN')}
              </p>
            </div>
            <div>{getStatusBadge(order.status)}</div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Cột Trái - Thông tin Tour & HDV */}
            <div className="lg:w-2/3 p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">Tour đã đặt</h2>
              
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
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-700 font-semibold mb-4">
                     Số lượng khách: <span className="text-emerald-600">{order.guest_count} người</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100 flex flex-col justify-center">
                      <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider mb-1">Khởi hành</p>
                      <p className="text-emerald-900 font-bold text-sm">{order.tour.start_date ? new Date(order.tour.start_date).toLocaleDateString("vi-VN") : "Đang cập nhật"}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100 flex flex-col justify-center">
                      <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider mb-1">Kết thúc</p>
                      <p className="text-emerald-900 font-bold text-sm">{order.tour.end_date ? new Date(order.tour.end_date).toLocaleDateString("vi-VN") : "Đang cập nhật"}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-3">{order.tour.itinerary}</p>
                </div>
              </div>

              {/* PHẦN HIỂN THỊ HƯỚNG DẪN VIÊN */}
              
              <div className="mt-6 p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
      {order.guide ? order.guide.full_name.charAt(0) : "?"}
    </div>
    <div>
      <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Hướng dẫn viên</p>
      <p className="text-slate-900 font-bold">{order.guide ? order.guide.full_name : "Đang cập nhật..."}</p>
    </div>
  </div>

  {order.guide && (
    <div className="flex gap-2 w-full sm:w-auto">
      {/* NÚT NHẮN TIN MỚI THÊM */}
      <button 
        onClick={() => router.push(`/chat?receiver_id=${order.guide?.id}`)}
        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Nhắn tin
      </button>

      <button 
        onClick={() => setShowGuideModal(true)}
        className="flex-1 sm:flex-none px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition shadow-sm"
      >
        Hồ sơ
      </button>
    </div>
  )}
</div>

              {/* Chính sách hủy tour */}
              <div className="mt-8 bg-orange-50 rounded-2xl p-5 border border-orange-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-orange-800 text-sm mb-1">Chính sách hủy tour</h4>
                  <p className="text-xs text-orange-700 leading-relaxed">Bạn sẽ nhận được khoản tiền hoàn lại đầy đủ nếu hủy trong vòng 24 giờ kể từ khi đặt đơn.</p>
                </div>
              </div>
            </div>

            {/* Cột Phải - Thanh toán */}
            <div className="lg:w-1/3 bg-slate-50 p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">Thanh toán</h2>

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
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-1 py-0.5 rounded">
                        {order.payment.transaction_id.length > 12 ? `${order.payment.transaction_id.slice(0,12)}...` : order.payment.transaction_id}
                      </span>
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
                    {canceling ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Hủy đơn & Hoàn tiền ngay"}
                  </button>
                ) : (
                   <button disabled className="w-full py-4 text-center rounded-xl bg-slate-200 text-slate-400 font-bold cursor-not-allowed">
                     {order.status === 'cancelled' ? 'Đơn hàng đã hủy' : 'Hết hạn hủy miễn phí'}
                   </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT HDV */}
      {showGuideModal && order.guide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-auto">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Hồ sơ Hướng dẫn viên</h3>
              <button onClick={() => setShowGuideModal(false)} className="text-2xl leading-none hover:rotate-90 transition-transform">&times;</button>
            </div>
            
            <div className="p-8">
               <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center text-3xl font-black mb-3 rotate-3 shadow-md">
                    {order.guide.full_name.charAt(0)}
                  </div>
                  <h4 className="text-2xl font-black text-slate-800">{order.guide.full_name}</h4>
                  <p className="text-indigo-600 font-semibold">{order.guide.years_of_experience || 0} năm kinh nghiệm</p>
               </div>

               <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-bold uppercase tracking-tighter">Email</span>
                    <span className="text-slate-800 text-sm font-semibold">{order.guide.email|| "Chưa cập nhật"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-bold uppercase tracking-tighter">Điện thoại</span>
                    <span className="text-slate-800 text-sm font-semibold">{order.guide.phone|| "Chưa cập nhật"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-bold uppercase tracking-tighter">Mã số thẻ</span>
                    <span className="text-slate-800 text-sm font-semibold">{order.guide.license_number|| "Chưa cập nhật"}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-bold uppercase tracking-tighter">Ngôn ngữ</span>
                    <span className="text-slate-800 text-sm font-semibold">{order.guide.languages|| "Chưa cập nhật"}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <span className="text-slate-500 text-sm font-bold block mb-1 uppercase tracking-tighter">Chuyên môn</span>
                    <p className="text-slate-700 text-sm italic">{order.guide.specialties|| "Chưa cập nhật"}</p>
                  </div>
               </div>

               <button 
                 onClick={() => setShowGuideModal(false)}
                 className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition shadow-lg"
               >
                 Đóng thông tin
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}