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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) return <div className="p-10 text-center">Đang tải báo cáo...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Báo cáo Doanh thu</h1>
        <p className="text-gray-500 mt-2">Theo dõi doanh thu và hoa hồng </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Doanh thu thực nhận (85%) */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl"></span>
                </div>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">85%</span>
              </div>
              <p className="text-sm opacity-90 font-medium">Doanh thu Thực nhận</p>
              <p className="text-3xl font-black mt-2">{formatMoney(summary.supplier_revenue)}</p>
              <p className="text-xs opacity-75 mt-2">Tổng từ {summary.total_orders} đơn hàng</p>
            </div>

            {/* Doanh thu chờ xử lý (Escrow) */}
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl"></span>
                </div>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">Escrow</span>
              </div>
              <p className="text-sm opacity-90 font-medium">Đang Chờ xử lý</p>
              <p className="text-3xl font-black mt-2">{formatMoney(summary.escrow_amount)}</p>
              <p className="text-xs opacity-75 mt-2">Từ {summary.pending_orders} đơn đang chờ</p>
            </div>

            {/* Hoa hồng Admin (15%) */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl"></span>
                </div>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">15%</span>
              </div>
              <p className="text-sm opacity-90 font-medium">Hoa hồng Nền tảng</p>
              <p className="text-3xl font-black mt-2">{formatMoney(summary.admin_commission)}</p>
              <p className="text-xs opacity-75 mt-2">Phí dịch vụ & marketing</p>
            </div>
          </div>

          {/* Breakdown Panel */}
          <div className="bg-white border rounded-3xl p-8 mb-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-800 mb-6">Chi tiết Hoa hồng</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600 font-medium">Tổng doanh thu (100%)</span>
                <span className="text-xl font-black text-gray-800">{formatMoney(summary.total_revenue)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b bg-red-50 px-4 rounded-xl">
                <span className="text-red-600 font-medium">− Hoa hồng Admin (15%)</span>
                <span className="text-xl font-black text-red-600">−{formatMoney(summary.admin_commission)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-emerald-50 px-4 rounded-xl">
                <span className="text-emerald-600 font-bold">= Doanh thu của bạn (85%)</span>
                <span className="text-2xl font-black text-emerald-600">{formatMoney(summary.supplier_revenue)}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Đã rút về tài khoản</p>
                <p className="text-lg font-black text-gray-800">{formatMoney(summary.paid_out_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Còn chờ thanh toán</p>
                <p className="text-lg font-black text-orange-600">{formatMoney(summary.pending_payout)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Revenue by Tour */}
      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b bg-gray-50">
          <h2 className="text-xl font-black text-gray-800">Doanh thu theo Tour</h2>
          <p className="text-sm text-gray-500 mt-1">Phân tích chi tiết từng tour</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Tour</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Đơn hàng</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Tổng DT</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Hoa hồng (15%)</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Của bạn (85%)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tourRevenue.map((tour) => (
                <tr key={tour.tour_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{tour.tour_name}</div>
                    <div className="text-xs text-gray-500">ID: {tour.tour_id}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                      {tour.total_bookings}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800">
                    {formatMoney(tour.total_revenue)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    {formatMoney(tour.admin_commission)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600">
                    {formatMoney(tour.supplier_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2">
              <tr className="font-black text-gray-800">
                <td className="px-6 py-4" colSpan={2}>TỔNG CỘNG</td>
                <td className="px-6 py-4 text-right">
                  {formatMoney(tourRevenue.reduce((sum, t) => sum + t.total_revenue, 0))}
                </td>
                <td className="px-6 py-4 text-right text-red-600">
                  {formatMoney(tourRevenue.reduce((sum, t) => sum + t.admin_commission, 0))}
                </td>
                <td className="px-6 py-4 text-right text-emerald-600">
                  {formatMoney(tourRevenue.reduce((sum, t) => sum + t.supplier_revenue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {tourRevenue.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            Chưa có dữ liệu doanh thu
          </div>
        )}
      </div>
    </div>
  );
}