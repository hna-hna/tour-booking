"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Lấy các tham số Stripe tự động thêm vào URL khi redirect về
  const redirectStatus = searchParams.get("redirect_status");
  const paymentIntentId = searchParams.get("payment_intent");

  const [count, setCount] = useState(15);
  const [isConfirmed, setIsConfirmed] = useState(false); // Tránh gọi API nhiều lần

  // 1. GỌI API XÁC NHẬN ĐƠN HÀNG VỚI BACKEND
  useEffect(() => {
    if (redirectStatus === "succeeded" && paymentIntentId && !isConfirmed) {
      
      console.log("Đang xác nhận đơn hàng với Backend...");

      fetch("http://127.0.0.1:5000/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_intent_id: paymentIntentId })
      })
      .then(async (res) => {
          if (res.ok) {
              console.log("Xác nhận thành công! Đơn hàng đã chuyển sang trạng thái PAID.");
              setIsConfirmed(true);
          } else {
              const err = await res.json();
              console.error("Lỗi xác nhận đơn:", err);
          }
      })
      .catch(err => console.error("Lỗi kết nối Backend:", err));
    }
  }, [redirectStatus, paymentIntentId, isConfirmed]);

  // 2. TỰ ĐỘNG CHUYỂN TRANG NẾU THẤT BẠI
  useEffect(() => {
    if (redirectStatus === "failed") {
        router.replace("/payment-fail?error_message=Ngân hàng từ chối giao dịch (Redirect)");
    }
  }, [redirectStatus, router]);

  // 3. ĐẾM NGƯỢC VỀ TRANG CHỦ
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Khi đếm về 0 thì mới chuyển trang (Tách riêng ra)
  useEffect(() => {
    if (count === 0) {
      router.push("/");
    }
  }, [count, router]);

  // Logic hiển thị icon và thông báo
  // Nếu status là failed, return null để tránh nháy giao diện trước khi redirect
  if (redirectStatus === "failed") return null;

  let content;
  if (redirectStatus === "succeeded") {
    content = (
      <>
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-800 uppercase italic mb-2">Thanh toán thành công!</h1>
        <p className="text-gray-500 font-medium mb-6">
          Mã giao dịch: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 text-sm">{paymentIntentId}</span>
        </p>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 text-sm font-semibold mb-6">
          Vé điện tử đã được gửi tới email của bạn. Chúc bạn có một chuyến đi tuyệt vời!
        </div>
        {/* Hiển thị trạng thái lưu database */}
        {isConfirmed ? (
            <p className="text-xs text-green-600 font-bold mb-4">✓ Đã lưu đơn hàng vào hệ thống</p>
        ) : (
            <p className="text-xs text-orange-500 font-bold mb-4 animate-pulse">⟳ Đang đồng bộ dữ liệu...</p>
        )}
      </>
    );
  } else if (redirectStatus === "processing") {
    content = (
      <>
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-800 uppercase italic mb-2">Đang xử lý...</h1>
        <p className="text-gray-500 mb-6">Giao dịch đang chờ xác nhận từ ngân hàng.</p>
      </>
    );
  } else {
    // Fallback cho các trường hợp lỗi khác
    content = (
      <>
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-red-200 shadow-xl">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-800 uppercase italic mb-2">Thanh toán thất bại</h1>
        <p className="text-gray-500 mb-6">Giao dịch bị từ chối hoặc đã xảy ra lỗi. Vui lòng thử lại.</p>
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center relative overflow-hidden border border-gray-100">
        {content}
        
        <Link href="/" className="block w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-wide hover:bg-gray-800 transition-all shadow-lg">
          Về trang chủ ({count}s)
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center p-10 font-bold text-gray-400">Đang xác thực kết quả giao dịch...</div>}>
      <SuccessContent />
    </Suspense>
  );
}