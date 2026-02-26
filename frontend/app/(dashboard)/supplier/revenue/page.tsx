"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface RevenueSummary {
  total_revenue: number;
  admin_commission: number;
  supplier_revenue: number;
  escrow_amount: number;
  paid_out_amount: number;
  pending_payout: number;
  total_orders: number;
  pending_orders: number;
}

interface TourRevenue {
  tour_id: number;
  tour_name: string;
  total_revenue: number;
  admin_commission: number;
  supplier_revenue: number;
  total_bookings: number;
}

export default function SupplierRevenueDashboard() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [tourRevenue, setTourRevenue] = useState<TourRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("Current Token:", token);
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, tourRes] = await Promise.all([
        axios.get("http://localhost:5000/api/supplier/revenue/summary", { headers }),
        axios.get("http://localhost:5000/api/supplier/revenue/by-tour", { headers })
      ]);

      setSummary(summaryRes.data);
      setTourRevenue(tourRes.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);

  if (loading)
    return <div className="p-10 text-center text-lg text-gray-500">Đang tải báo cáo...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-10 px-6">
      <div className="max-w-7xl mx-auto transition-all duration-300">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Báo cáo Doanh thu
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Theo dõi doanh thu và hoa hồng theo thời gian thực
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

              {/* Supplier Revenue */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 
                rounded-3xl p-8 text-white shadow-2xl shadow-emerald-500/30 
                hover:scale-[1.02] transition-transform duration-300">
                <p className="text-sm opacity-90 font-medium">Doanh thu Thực nhận</p>
                <p className="text-3xl font-black mt-2">
                  {formatMoney(summary.supplier_revenue)}
                </p>
                <p className="text-xs opacity-75 mt-2">
                  Tổng từ {summary.total_orders} đơn
                </p>
              </div>

              {/* Escrow */}
              <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 
                rounded-3xl p-8 text-white shadow-2xl shadow-orange-400/30 
                hover:scale-[1.02] transition-transform duration-300">
                <p className="text-sm opacity-90 font-medium">Đang chờ xử lý</p>
                <p className="text-3xl font-black mt-2">
                  {formatMoney(summary.escrow_amount)}
                </p>
                <p className="text-xs opacity-75 mt-2">
                  {summary.pending_orders} đơn chờ
                </p>
              </div>

              {/* Admin */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 
                rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/30 
                hover:scale-[1.02] transition-transform duration-300">
                <p className="text-sm opacity-90 font-medium">Hoa hồng nền tảng</p>
                <p className="text-3xl font-black mt-2">
                  {formatMoney(summary.admin_commission)}
                </p>
                <p className="text-xs opacity-75 mt-2">
                  Phí dịch vụ (15%)
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-white/80 backdrop-blur border border-gray-200 
              rounded-3xl p-8 mb-10 shadow-xl">
              <h2 className="text-xl font-black text-gray-800 mb-6">
                Chi tiết hoa hồng
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Tổng doanh thu</span>
                  <span className="font-bold">
                    {formatMoney(summary.total_revenue)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-red-50 px-4 rounded-xl">
                  <span className="text-red-600">− Hoa hồng Admin</span>
                  <span className="font-bold text-red-600">
                    −{formatMoney(summary.admin_commission)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-emerald-50 px-4 rounded-xl">
                  <span className="text-emerald-700 font-bold">
                    = Doanh thu của bạn
                  </span>
                  <span className="text-xl font-black text-emerald-600">
                    {formatMoney(summary.supplier_revenue)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Đã rút</p>
                  <p className="text-lg font-black">
                    {formatMoney(summary.paid_out_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chờ thanh toán</p>
                  <div className="text-lg font-black text-orange-600">
                    {formatMoney(summary.pending_payout)}
                    <div className="mt-8">
  {summary && (
    <>
      <button 
        disabled={summary.pending_payout <= 0}
        onClick={() => alert("Yêu cầu rút tiền đã được gửi tới Admin!")}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
          summary.pending_payout > 0 
            ? "bg-black text-white hover:bg-gray-800 shadow-xl active:scale-95" 
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {summary.pending_payout > 0 ? "Yêu cầu rút tiền ngay" : "Chưa đủ số dư để rút"}
      </button>
      
      <p className="text-[10px] text-gray-400 text-center mt-3 uppercase font-bold">
        Tiền sẽ được chuyển vào tài khoản ngân hàng đã đăng ký trong 24h
      </p>
    </>
  )}
</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Table */}
        <div className="bg-white border rounded-3xl overflow-hidden shadow-lg">
          <div className="p-8 border-b bg-gray-50">
            <h2 className="text-xl font-black text-gray-800">
              Doanh thu theo Tour
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Phân tích chi tiết từng tour
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-4 text-left">Tour</th>
                  <th className="px-6 py-4 text-right">Đơn</th>
                  <th className="px-6 py-4 text-right">Tổng</th>
                  <th className="px-6 py-4 text-right">Hoa hồng</th>
                  <th className="px-6 py-4 text-right">Của bạn</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tourRevenue.map((tour) => (
                  <tr key={tour.tour_id} className="hover:bg-gray-100/60 transition">
                    <td className="px-6 py-4 font-bold">{tour.tour_name}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                        {tour.total_bookings}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      {formatMoney(tour.total_revenue)}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-bold">
                      {formatMoney(tour.admin_commission)}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-black">
                      {formatMoney(tour.supplier_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
