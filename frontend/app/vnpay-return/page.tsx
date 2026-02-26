"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

// Hàm format tiền tệ VNĐ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

function VnpayReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [count, setCount] = useState(10); // Đếm ngược 10 giây
  const [orderInfo, setOrderInfo] = useState({
    orderId: "",
    amount: 0,
    bankCode: ""
  });

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    if (Object.keys(params).length > 0 && status === "loading") {
      // 1. Lấy thông tin sơ bộ từ URL để hiển thị ngay (UX)
      const amount = params.vnp_Amount ? Number(params.vnp_Amount) / 100 : 0;
      setOrderInfo({
        orderId: params.vnp_TxnRef || "Unknown",
        amount: amount,
        bankCode: params.vnp_BankCode || "VNPAY"
      });

      // 2. Gọi Backend xác thực Checksum (Bảo mật)
      axios.get("http://127.0.0.1:5000/vnpay_return", { params })
        .then((res) => {
          if (res.data.RspCode === "00") {
            setStatus("success");
          } else {
            setStatus("failed");
          }
        })
        .catch((err) => {
          console.error("Lỗi xác thực VNPay:", err);
          setStatus("failed");
        });
    }
  }, [searchParams, status]);

  // Logic đếm ngược
  useEffect(() => {
    if (status === "success") {
      const timer = setInterval(() => {
        setCount((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  // Logic chuyển trang khi đếm về 0
  useEffect(() => {
    if (count === 0 && status === "success") {
      router.push("/");
    }
  }, [count, status, router]);

  // --- GIAO DIỆN LOADING ---
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Đang xác thực giao dịch...</h2>
        <p className="text-gray-500 text-sm mt-2">Vui lòng không tắt trình duyệt</p>
      </div>
    );
  }

  // --- GIAO DIỆN THẤT BẠI ---
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Thanh toán thất bại</h1>
          <p className="text-gray-500 mb-8">
            Giao dịch bị lỗi, bị hủy hoặc chữ ký không hợp lệ. Vui lòng thử lại.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left text-sm">
             <div className="flex justify-between mb-2">
                <span className="text-gray-500">Mã giao dịch:</span>
                <span className="font-medium text-gray-900">{orderInfo.orderId}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-500">Kết quả:</span>
                <span className="font-bold text-red-600">Failed / Cancelled</span>
             </div>
          </div>

          <Link 
            href="/" 
            className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN THÀNH CÔNG (GIỐNG STRIPE) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Header xanh lá */}
        <div className="bg-emerald-500 h-2 absolute top-0 left-0 w-full"></div>

        <div className="p-8 text-center">
          {/* Icon Checkmark Animated */}
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2">Thành công!</h1>
          <p className="text-gray-500 mb-8 font-medium">
            Cảm ơn bạn đã đặt tour
          </p>

          {/* Chi tiết đơn hàng */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8 text-sm">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <span className="text-gray-500">Tổng thanh toán</span>
              <span className="text-xl font-bold text-emerald-600">
                {formatCurrency(orderInfo.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">Mã giao dịch</span>
              <span className="font-mono font-medium text-gray-900">{orderInfo.orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Ngân hàng</span>
              <span className="font-medium text-gray-900">{orderInfo.bankCode}</span>
            </div>
          </div>

          {/* Nút bấm */}
          <Link 
            href="/" 
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 mb-4"
          >
            Về trang chủ ngay
          </Link>

          {/* Đếm ngược */}
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Tự động chuyển hướng sau {count}s
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VnpayReturnContent />
    </Suspense>
  );
}