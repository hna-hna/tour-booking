"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

// Hàm format tiền tệ VNĐ chuyên nghiệp
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
  const [count, setCount] = useState(10); // Đếm ngược 10 giây để quay về trang chủ
  const [orderInfo, setOrderInfo] = useState({
    orderId: "",
    amount: 0,
    bankCode: ""
  });
  
  // Các State bổ sung từ nhánh origin/nnna
  const [tour, setTour] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [guests, setGuests] = useState<number | null>(null);

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    if (Object.keys(params).length > 0 && status === "loading") {
      // 1. Lấy thông tin hiển thị nhanh từ URL (UX tốt hơn)
      const amount = params.vnp_Amount ? Number(params.vnp_Amount) / 100 : 0;
      setOrderInfo({
        orderId: params.vnp_TxnRef || "Unknown",
        amount: amount,
        bankCode: params.vnp_BankCode || "VNPAY"
      });

      // 2. Gọi Backend xác thực Checksum (Bảo mật tuyệt đối)
      axios.get("http://127.0.0.1:5000/vnpay_return", { params })
        .then((res) => {
          if (res.data.RspCode === "00") {
            setStatus("success");
            
            // Cập nhật thông tin chi tiết từ kết quả trả về của Flask
            if (res.data.bookingDate) setBookingDate(res.data.bookingDate);
            if (res.data.guests) setGuests(res.data.guests);

            // Nếu Backend trả về tourId, lấy thêm thông tin chi tiết tour đó
            if (res.data.tourId) {
              axios.get(`http://127.0.0.1:5000/api/tours/${res.data.tourId}`)
                .then(tRes => setTour(tRes.data))
                .catch(err => console.error("Lỗi lấy thông tin tour VNPay:", err));
            }
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

  // Logic đếm ngược tự động chuyển trang
  useEffect(() => {
    if (status === "success") {
      const timer = setInterval(() => {
        setCount((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  useEffect(() => {
    if (count === 0 && status === "success") {
      router.push("/");
    }
  }, [count, status, router]);

  // --- GIAO DIỆN CHỜ (LOADING) ---
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 italic">Đang xác thực giao dịch từ VNPay...</h2>
        <p className="text-gray-500 text-sm mt-2">Quá trình này có thể mất vài giây, vui lòng giữ kết nối.</p>
      </div>
    );
  }

  // --- GIAO DIỆN THẤT BẠI ---
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-10 border border-gray-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase">Thanh toán thất bại</h1>
          <p className="text-gray-500 mb-8 font-medium">
            Giao dịch bị lỗi hoặc đã bị hủy. Hệ thống chưa nhận được khoản thanh toán của bạn.
          </p>
          
          <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left text-sm border border-gray-100">
             <div className="flex justify-between mb-2">
                <span className="text-gray-400">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-gray-900">{orderInfo.orderId}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-400">Trạng thái:</span>
                <span className="font-bold text-red-600 italic underline">Giao dịch lỗi</span>
             </div>
          </div>

          <Link 
            href="/checkout" 
            className="block w-full bg-black text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg"
          >
            Thử thanh toán lại
          </Link>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN THÀNH CÔNG ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white">
        <div className="bg-emerald-500 h-2 absolute top-0 left-0 w-full"></div>

        <div className="p-10 text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-emerald-200 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2 italic uppercase">Tuyệt vời!</h1>
          <p className="text-gray-500 mb-8 font-medium italic">
            Thanh toán của bạn đã được xác nhận.
          </p>

          {/* HIỂN THỊ THÔNG TIN TOUR ĐÃ ĐẶT (Cập nhật từ origin/nnna) */}
          {tour && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 mb-8 text-sm text-left shadow-inner">
              <h3 className="font-black text-emerald-900 text-lg mb-3 line-clamp-1">🏷️ {tour.name}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-200/50 border-dashed">
                  <span className="text-emerald-700 font-medium">Khởi hành</span>
                  <span className="font-bold text-gray-900">{bookingDate ? new Date(bookingDate).toLocaleDateString('vi-VN') : "Liên hệ"}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-emerald-200/50 border-dashed">
                  <span className="text-emerald-700 font-medium">Số khách</span>
                  <span className="font-bold text-gray-900">{guests ? `${guests} người` : "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700 font-medium">Mã giao dịch</span>
                  <span className="font-mono font-bold text-gray-900">{orderInfo.orderId}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 uppercase text-[10px] font-bold tracking-widest">Tổng tiền đã trả</span>
              <span className="text-2xl font-black text-emerald-600">
                {formatCurrency(orderInfo.amount)}
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95 mb-4 uppercase tracking-wider"
          >
            Về trang chủ ({count}s)
          </Link>

          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Vé điện tử đã được gửi tới Email của bạn
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Đang chuẩn bị dữ liệu...</div>}>
      <VnpayReturnContent />
    </Suspense>
  );
}