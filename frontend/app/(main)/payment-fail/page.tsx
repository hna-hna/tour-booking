"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function FailContent() {
  const searchParams = useSearchParams();
  // Stripe thường trả về error_message trên URL nếu có
  const errorMessage = searchParams.get("error_message") || "Giao dịch bị từ chối hoặc đã xảy ra lỗi.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center border border-red-100 relative overflow-hidden">
        
        {/* Hiệu ứng nền cảnh báo */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-50 rounded-full blur-3xl"></div>

        {/* Icon Thất bại */}
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-red-100 shadow-xl border border-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-gray-800 uppercase italic mb-3 tracking-tight">Thanh toán thất bại</h1>
        
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8">
          <p className="text-sm font-bold text-red-800 uppercase mb-1">Chi tiết lỗi</p>
          <p className="text-sm text-gray-600">{errorMessage}</p>
        </div>

        <div className="space-y-3">
          {/* Nút quay lại trang thanh toán (Sử dụng history.back để giữ lại thông tin tour đã chọn) */}
          <button 
            onClick={() => window.history.back()} 
            className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-wide hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Thử thanh toán lại
          </button>

          <Link 
            href="/support" 
            className="block w-full py-4 bg-white text-gray-500 border border-gray-200 rounded-xl font-bold uppercase tracking-wide hover:bg-gray-50 transition-colors"
          >
            Liên hệ hỗ trợ
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link href="/" className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest">
            ← Về trang chủ
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="text-center p-10 font-bold text-gray-400">Đang kiểm tra lỗi...</div>}>
      <FailContent />
    </Suspense>
  );
}