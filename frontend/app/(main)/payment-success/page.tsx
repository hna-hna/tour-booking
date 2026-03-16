"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Các tham số Stripe/VNPay tự động thêm vào URL
  const redirectStatus = searchParams.get("redirect_status");
  const paymentIntentId = searchParams.get("payment_intent");
  const tourId = searchParams.get("tourId"); 

  const [count, setCount] = useState(15);
  const [isConfirmed, setIsConfirmed] = useState(false); 
  const [tour, setTour] = useState<any>(null);

  // 1. LẤY THÔNG TIN TOUR ĐỂ HIỂN THỊ TÓM TẮT
  useEffect(() => {
    if (tourId) {
      fetch(`http://127.0.0.1:5000/api/tours/${tourId}`)
        .then((res) => res.json())
        .then((data) => setTour(data))
        .catch((err) => console.error("Lỗi lấy thông tin tour: ", err));
    }
  }, [tourId]);

  // 2. GỌI API XÁC NHẬN ĐƠN HÀNG VỚI BACKEND (Để chuyển trạng thái sang PAID)
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
              console.log("Xác nhận thành công!");
              setIsConfirmed(true);
          } else {
              const err = await res.json();
              console.error("Lỗi xác nhận đơn:", err);
          }
      })
      .catch(err => console.error("Lỗi kết nối Backend:", err));
    }
  }, [redirectStatus, paymentIntentId, isConfirmed]);

  // 3. TỰ ĐỘNG CHUYỂN TRANG NẾU GIAO DỊCH THẤT BẠI
  useEffect(() => {
    if (redirectStatus === "failed") {
        router.replace("/payment-fail?error_message=Giao dịch bị từ chối");
    }
  }, [redirectStatus, router]);

  // 4. ĐẾM NGƯỢC VỀ TRANG CHỦ
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (count === 0) {
      router.push("/");
    }
  }, [count, router]);

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
          Mã giao dịch: {paymentIntentId ? <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800 text-sm">{paymentIntentId}</span> : "N/A"}
        </p>

        {/* HIỂN THỊ THẺ THÔNG TIN TOUR (Cập nhật mới) */}
        {tour && (
          <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl mb-6 flex flex-col md:row gap-4 items-center md:items-start text-left">
            {tour.image_urls && tour.image_urls.length > 0 ? (
              <img src={tour.image_urls[0]} alt={tour.name} className="w-24 h-24 object-cover rounded-xl shadow-sm" />
            ) : (
              <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">No Image</div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-lg line-clamp-2 leading-tight">{tour.name}</h3>
              <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                <p>📍 {tour.location}</p>
                <p>⏱️ {tour.duration} ngày</p>
                <p>💰 {Number(tour.price).toLocaleString()}đ</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 text-sm font-semibold mb-6">
          Vé điện tử đã được gửi tới email của bạn. Chúc bạn có một chuyến đi tuyệt vời!
        </div>
        
        {isConfirmed ? (
            <p className="text-xs text-green-600 font-bold mb-4">✓ Đã đồng bộ đơn hàng thành công</p>
        ) : (
            <p className="text-xs text-orange-500 font-bold mb-4 animate-pulse">⟳ Đang cập nhật hệ thống...</p>
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
    content = (
      <>
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-red-200 shadow-xl">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-800 uppercase italic mb-2">Thanh toán thất bại</h1>
        <p className="text-gray-500 mb-6">Vui lòng kiểm tra lại số dư hoặc thẻ ngân hàng.</p>
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
    <Suspense fallback={<div className="text-center p-10 font-bold text-gray-400 italic">Đang tải kết quả...</div>}>
      <SuccessContent />
    </Suspense>
  );
}