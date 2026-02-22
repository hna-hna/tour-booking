"use client";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [tour, setTour] = useState<any>(null);

  useEffect(() => {
    if (tourId) {
      // Đảm bảo URL API này đúng và Backend đang bật
      axios.get(`http://localhost:5000/api/tours/${tourId}`)
        .then(res => setTour(res.data))
        .catch(err => console.error("Lỗi lấy thông tin tour:", err));
    }
  }, [tourId]);

  const TOUR_BASE_PRICE = tour ? tour.price : 0;
  const WEEKEND_SURCHARGE = 500000;

  const unitPrice = useMemo(() => {
    if (!selectedDate) return TOUR_BASE_PRICE;
    const day = new Date(selectedDate).getDay();
    return (day === 0 || day === 6) ? TOUR_BASE_PRICE + WEEKEND_SURCHARGE : TOUR_BASE_PRICE;
  }, [selectedDate, TOUR_BASE_PRICE]);

  const totalAmount = guestCount * unitPrice;

  const handlePayment = () => {
    if (!selectedDate || guestCount <= 0) {
      alert("Vui lòng chọn ngày và số lượng khách!");
      return;
    }
    setLoading(true);

    // Ép chuyển hướng bằng window.location để đảm bảo thành công 100%
    const targetUrl = `/payments?id=${tourId}&amount=${totalAmount}&guests=${guestCount}&date=${selectedDate}`;

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 italic uppercase tracking-tighter">Xác nhận đặt Tour</h1>
          {/* ĐOẠN HIỂN THỊ TÊN TOUR CỦA BẠN ĐÂY */}
          {tour ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Tour đang chọn</span>
              <p className="text-emerald-600 font-bold">{tour.name}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-2 italic italic">Đang tải thông tin tour #{tourId}...</p>
          )}
          <div className="h-1.5 w-20 bg-emerald-500 mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 shadow-sm border-l-4 border-l-emerald-500">
              <h2 className="text-lg font-bold mb-6 text-emerald-900 uppercase tracking-wid">1. Thông tin chuyến đi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-[0.2em]">Ngày khởi hành *</label>
                  <input type="date" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 shadow-inner" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-[0.2em]">Số lượng khách *</label>
                  <input type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 text-xl shadow-inner" />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 shadow-sm border-l-4 border-l-emerald-500">
              <h2 className="text-lg font-bold mb-6 text-emerald-900 uppercase tracking-wid">2. Thông tin khách hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Họ và tên" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all shadow-inner" />
                <input type="email" placeholder="Email nhận thông tin" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all shadow-inner" />
              </div>
            </div>
          </div>

          <div className="h-fit sticky top-10">
            <div className="bg-emerald-50 border border-gray-100 rounded-xl p-6 shadow-md overflow-hidden">
              <div className="bg-emerald-50 -mx-6 -mt-6 p-4 mb-6 border-b border-gray-100">
                <h2 className="text-md font-bold text-center text-gray-700 uppercase">Chi tiết thanh toán</h2>
              </div>
              {guestCount > 0 && selectedDate ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Ngày đi:</span>
                    <span className="font-bold text-gray-800">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Đơn giá:</span>
                    <span className="font-semibold text-gray-800">{unitPrice.toLocaleString()}đ</span>

                  </div>
                  <div className="flex justify-between items-center text-sm pb-4 border-b">
                    <span className="text-gray-500">Số lượng:</span>
                    <span className="font-semibold text-gray-800">{guestCount} người</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">Tổng cộng:</span>
                      <span className="text-2xl font-black text-red-600 leading-none">{totalAmount.toLocaleString()}đ</span>

                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-right">* Giá đã bao gồm thuế và phí dịch vụ</p>

                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg transition-all active:scale-[0.98] disabled:bg-gray-300 uppercase tracking-tighter shadow-sm">

                    {loading ? "Đang xử lý..." : "Xác nhận đặt ngay"}

                  </button>

                </div>

              ) : (

                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Vui lòng nhập <strong>thông tin bên trái</strong> để xem báo giá.

                  </p>

                </div>

              )}

            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-[11px] text-blue-700 text-center leading-relaxed">
                Hệ thống thanh toán bảo mật. <br /> Thông tin của bạn luôn được giữ kín tuyệt đối.

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}