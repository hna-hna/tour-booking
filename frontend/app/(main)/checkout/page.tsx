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
  const [guestName, setGuestName] = useState("");
  const [tour, setTour] = useState<any>(null);
  const [note, setNote] = useState("");

  // FORMAT NGÀY CHO ĐẸP
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // CHUYỂN ĐỔI ÂM LỊCH SANG DƯƠNG LỊCH (Đơn giản hóa)
  const lunarToSolar = (lunarDay: number, lunarMonth: number, year: number): Date | null => {
    const tetData: Record<number, Date> = {
      2024: new Date('2024-02-10'),
      2025: new Date('2025-01-29'), 
      2026: new Date('2026-02-17'),
      2027: new Date('2027-02-06'),
      2028: new Date('2028-01-26'),
      2029: new Date('2029-02-13'),
      2030: new Date('2030-02-03')
    };

    const tetDate = tetData[year];
    if (!tetDate) return null;

    const daysOffset = (lunarMonth - 1) * 29.5 + (lunarDay - 1);
    const solarDate = new Date(tetDate);
    solarDate.setDate(tetDate.getDate() + Math.floor(daysOffset));

    return solarDate;
  };

  // KIỂM TRA NGÀY LỄ VIỆT NAM TỰ ĐỘNG THEO NĂM
  const isHoliday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();

    const fixedHolidays = [
      { day: 1, month: 1 },
      { day: 8, month: 3 },
      { day: 30, month: 4 },
      { day: 1, month: 5 },
      { day: 14, month: 2 },
      { day: 20, month: 10 },
      { day: 2, month: 9 }
    ];

    const isFixedHoliday = fixedHolidays.some(holiday => 
      holiday.day === day && holiday.month === month
    );

    const tetDates = [
      lunarToSolar(1, 1, year),
      lunarToSolar(2, 1, year),
      lunarToSolar(3, 1, year)
    ].filter(Boolean);

    const isTetHoliday = tetDates.some(tetDate => {
      if (!tetDate) return false;
      return tetDate.getDate() === day && 
             tetDate.getMonth() + 1 === month &&
             tetDate.getFullYear() === year;
    });

    const gioToDate = lunarToSolar(10, 3, year);
    const isGioToHoliday = gioToDate && 
                          gioToDate.getDate() === day && 
                          gioToDate.getMonth() + 1 === month &&
                          gioToDate.getFullYear() === year;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return isFixedHoliday || isTetHoliday || isGioToHoliday || isWeekend;
  };

  // LẤY TÊN NGÀY LỄ
  const getHolidayName = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();

    const holidayNames = {
      '1-1': 'Tết Dương lịch',
      '8-3': 'Ngày Phụ nữ 8/3', 
      '14-2': 'Valentine',
      '30-4': 'Giải phóng 30/4',
      '1-5': 'Ngày Lao động',
      '2-9': 'Quốc khánh',
      '20-10': 'Phụ nữ VN 20/10'
    };

    for (const [key, name] of Object.entries(holidayNames)) {
      const [hDay, hMonth] = key.split('-').map(Number);
      if (hDay === day && hMonth === month) return name;
    }

    const tetDates = [
      lunarToSolar(1, 1, year),
      lunarToSolar(2, 1, year),
      lunarToSolar(3, 1, year)
    ];

    const tetNames = ['Mùng 1 Tết', 'Mùng 2 Tết', 'Mùng 3 Tết'];
    for (let i = 0; i < tetDates.length; i++) {
       const currentTet = tetDates[i]; // Lấy ra biến tạm
       if (currentTet && currentTet.getDate() === day && 
           currentTet.getMonth() + 1 === month) {
          return tetNames[i];
      }
    }

    const gioToDate = lunarToSolar(10, 3, year);
    if (gioToDate && gioToDate.getDate() === day && 
        gioToDate.getMonth() + 1 === month) {
      return 'Giỗ Tổ Hùng Vương';
    }

    if (dayOfWeek === 0) return 'Chủ nhật';
    if (dayOfWeek === 6) return 'Thứ Bảy';

    return '';
  };

  useEffect(() => {
    if (tourId) {
      axios.get(`http://localhost:5000/api/tours/${tourId}`)
        .then(res => setTour(res.data))
        .catch(err => console.error("Lỗi lấy thông tin tour:", err));
    }
  }, [tourId]);

  const TOUR_BASE_PRICE = tour ? tour.price : 0;
  
  // TÍNH GIÁ TĂNG 10% NGÀY LỄ
  const holidaySurchargePercent = 0.10; // 10%
  const holidaySurcharge = isHoliday(tour?.start_date || '') ? 
    Math.round(TOUR_BASE_PRICE * holidaySurchargePercent) : 0;
  const finalPricePerGuest = TOUR_BASE_PRICE + holidaySurcharge;
  const totalAmount = guestCount * finalPricePerGuest;
  const hasHolidaySurcharge = holidaySurcharge > 0;
  const holidayName = hasHolidaySurcharge ? getHolidayName(tour?.start_date || '') : '';

  const handlePayment = () => {
    if (guestCount <= 0) {
      alert("Vui lòng nhập số lượng khách!");
      return;
    }

    setLoading(true);

    const targetUrl = `/payments?id=${tourId}&amount=${totalAmount}&guests=${guestCount}&name=${encodeURIComponent(guestName)}`;

    setTimeout(() => {
      window.location.href = targetUrl;
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 italic uppercase tracking-tighter">
            Xác nhận đặt Tour
          </h1>
          
          {tour ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                Tour đang chọn
              </span>
              <p className="text-emerald-600 font-bold">{tour.name}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-2 italic">
              Đang tải thông tin tour #{tourId}...
            </p>
          )}

          <div className="h-1.5 w-20 bg-emerald-500 mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Cột trái */}
          <div className="lg:col-span-2 space-y-8">

            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm border-l-4 border-l-emerald-500">
              <h2 className="text-lg font-bold mb-6 text-gray-800 uppercase tracking-wide">
                1. Thông tin chuyến đi
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* HIỂN THỊ THỜI GIAN TOUR - BỎ 10% */}
                {tour && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-[0.2em]">
                      Thời gian tour
                    </label>
                    <div className={`p-4 rounded-2xl font-bold ${hasHolidaySurcharge ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        {formatDate(tour.start_date)} → {formatDate(tour.end_date)}
                        {hasHolidaySurcharge && (
                          <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                            {holidayName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* SỐ KHÁCH */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-[0.2em]">
                    Số lượng khách *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={(e) =>
                      setGuestCount(Math.max(1, parseInt(e.target.value) || 0))
                    }
                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 text-xl shadow-inner"
                  />
                </div>

              </div>
            </div>

            {/* THÔNG TIN KHÁCH */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm border-l-4 border-l-emerald-500">
              <h2 className="text-lg font-bold mb-6 text-gray-800 uppercase tracking-wide">
                2. Thông tin khách hàng
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all shadow-inner"
                />
                <input
                  type="email"
                  placeholder="Email nhận thông tin"
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="mt-6">
                <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.2em]">
                  Ghi chú cho Hướng dẫn viên
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Tôi ăn chay, gia đình có trẻ nhỏ..."
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all shadow-inner resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Cột phải */}
          <div className="h-fit sticky top-10">

            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-md overflow-hidden">
              <div className="bg-gray-50 -mx-6 -mt-6 p-4 mb-6 border-b border-gray-100">
                <h2 className="text-md font-bold text-center text-gray-700 uppercase">
                  Chi tiết thanh toán
                </h2>
              </div>

              {tour ? (
                <div className="space-y-4">

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Thời gian:</span>
                    <span className="font-bold text-gray-800">
                      {formatDate(tour.start_date)} → {formatDate(tour.end_date)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Đơn giá:</span>
                    <span className="font-semibold text-gray-800">
                      {TOUR_BASE_PRICE.toLocaleString()}đ
                    </span>
                  </div>

                  {hasHolidaySurcharge && (
                    <div className="flex justify-between items-center text-sm bg-orange-50 p-3 rounded-xl border border-orange-200">
                      <span className="text-orange-700 font-semibold">
                        {holidayName ? `Phí ${holidayName}:` : 'Phí ngày lễ:'}
                      </span>
                      <span className="font-bold text-orange-600 text-lg">
                        +{holidaySurcharge.toLocaleString()}đ 
                        <span className="text-sm font-normal">({(holidaySurchargePercent * 100).toFixed(0)}%)</span>
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm pb-4 border-b">
                    <span className="text-gray-500">Số lượng:</span>
                    <span className="font-semibold text-gray-800">
                      {guestCount} người
                    </span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-gray-700">Tổng cộng:</span>
                      <span className={`text-2xl font-black leading-none ${hasHolidaySurcharge ? 'text-orange-600' : 'text-red-600'}`}>
                        {totalAmount.toLocaleString()}đ
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-right">
                      * Giá đã bao gồm thuế và phí dịch vụ
                    </p>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg transition-all active:scale-[0.98] disabled:bg-gray-300 uppercase tracking-tighter shadow-sm"
                  >
                    {loading ? "Đang xử lý..." : "Xác nhận đặt ngay"}
                  </button>

                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Đang tải thông tin tour...
                  </p>
                </div>
              )}

            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-[11px] text-blue-700 text-center leading-relaxed font-medium">
                Hệ thống tự động áp dụng phí ngày lễ theo lịch Việt Nam. <br />Thông tin luôn được mã hóa tuyệt đối.
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
    <Suspense fallback={<div className="p-20 text-center font-bold text-gray-500 italic">Đang tải trang thanh toán...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}