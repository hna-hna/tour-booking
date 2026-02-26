"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Lấy đúng các tham số mà trang Checkout đã truyền qua URL
  const tourId = searchParams.get("id");
  const amount = searchParams.get("amount");
  const guests = searchParams.get("guests");
  const date = searchParams.get("date"); // Lấy thêm ngày khởi hành

  const [tour, setTour] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState("vnpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Thời gian giữ chỗ đã hết! Hệ thống đã hủy phiên thanh toán của bạn.");
      router.push(`/tours/${tourId || ""}`);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router, tourId]);

  // 2. Gọi API lấy thông tin Tour thật để hiển thị tên và ảnh
  useEffect(() => {
    if (tourId) {
      axios.get(`http://localhost:5000/api/tours/${tourId}`)
        .then(res => setTour(res.data))
        .catch(err => console.error("Lỗi lấy dữ liệu tour:", err));
    }
  }, [tourId]);

  const handleFinalPayment = async () => {
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vui lòng đăng nhập để tiếp tục!");
        window.location.href = "/login";
        return;
      }

      const res = await axios.post("http://localhost:5000/api/orders/", {
        tour_id: tourId,
        total_price: amount,
        guest_count: guests,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      router.push(`/redirect?status=success&tourId=${tourId}&orderId=${res.data.order_id}`);
    } catch (error: any) {
      console.error("Lỗi đặt tour:", error);
      alert("Đặt tour thất bại! Vui lòng thử lại.");
      router.push(`/redirect?status=error&tourId=${tourId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { id: "vnpay", name: "VNPay " },
    { id: "visa", name: "Thẻ Quốc tế", desc: "Visa, Mastercard, JCB" },
    { id: "atm", name: "Thẻ ATM Nội địa", desc: "Thẻ ngân hàng có Internet Banking" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* CỘT TRÁI: CHỌN PHƯƠNG THỨC (Chiếm 3 cột) */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-emerald-50">
          <div className="mb-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Thanh toán đơn hàng</h2>
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold border border-red-100 shadow-sm animate-pulse w-fit">
                <span>Thanh toán trong vòng:</span>
                <span className="text-xl font-black">
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="h-1 w-16 bg-emerald-500 mt-2"></div>
          </div>

          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${selectedMethod === method.id
                  ? "border-emerald-500 bg-emerald-50/50 shadow-inner"
                  : "border-gray-100 hover:border-emerald-200 bg-gray-50/50"
                  }`}
              >
                <div className="text-3xl grayscale-[0.5] group-hover:grayscale-0"></div>
                <div className="flex-1">
                  <h4 className={`font-bold text-base ${selectedMethod === method.id ? "text-emerald-700" : "text-gray-700"}`}>
                    {method.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">{method.desc}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? "border-emerald-500 bg-white" : "border-gray-300"}`}>
                  {selectedMethod === method.id && <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>}
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={isProcessing}
            onClick={handleFinalPayment}
            className="w-full mt-10 bg-emerald-500 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all uppercase tracking-tighter"
          >
            {isProcessing ? "Đang xử lý giao dịch..." : "Xác nhận & Thanh toán ngay"}
          </button>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (Chiếm 2 cột) */}
        <div className="lg:col-span-2 bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-200 flex flex-col justify-between relative overflow-hidden">
          {/* Trang trí nền */}
          <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <p className="text-black font-black text-gray-800 uppercase tracking-[0.2em] mb-6 text-center">Chi tiết chuyến đi</p>

            {tour ? (
              <div className="space-y-6">
                <h3 className="text-xl font-black leading-tight italic">{tour.name}</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-white/10 text-sm">
                    <span className="text-white font-medium italic">Ngày đi:</span>
                    <span className="font-bold">{date || "Chưa chọn"}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/10 text-sm">
                    <span className="text-white font-medium italic">Số khách:</span>
                    <span className="font-bold">{guests} người</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/10 text-sm">
                    <span className="text-white font-medium italic">Mã Tour:</span>
                    <span className="font-bold">#{tourId}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                <div className="h-20 bg-white/10 rounded"></div>
              </div>
            )}
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
            <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest mb-1">Tổng tiền thanh toán</p>
            <div className="flex justify-between items-end">
              <p className="text-4xl font-black italic tracking-tighter">
                {Number(amount).toLocaleString()}đ
              </p>
              <div className="bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">
                <p className="text-[9px] font-bold tracking-tighter">SECURE PAYMENT</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-emerald-600 uppercase italic">Đang tải thông tin...</div>}>
      <PaymentContent />
    </Suspense>
  );
}