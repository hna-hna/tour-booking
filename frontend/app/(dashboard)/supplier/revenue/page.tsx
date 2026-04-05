"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface RevenueSummary {
  total_revenue: number;
  admin_commission: number;
  supplier_revenue: number;
  total_orders: number;
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
  const [filteredTourRevenue, setFilteredTourRevenue] = useState<TourRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "revenue">("revenue");

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
      setFilteredTourRevenue(tourRes.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter và Sort logic
  useEffect(() => {
    let filtered = [...tourRevenue];

    // Lọc theo tên tour
    if (searchTerm.trim()) {
      filtered = filtered.filter(tour =>
        tour.tour_name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b.tour_id || 0) - (a.tour_id || 0); // Giả sử tour_id tăng theo thời gian
        case "oldest":
          return (a.tour_id || 0) - (b.tour_id || 0);
        case "revenue":
        default:
          return (b.total_revenue || 0) - (a.total_revenue || 0);
      }
    });

    setFilteredTourRevenue(filtered);
  }, [tourRevenue, searchTerm, sortBy]);

  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);

  const getSortLabel = (value: string) => {
    switch (value) {
      case "newest": return "Mới nhất";
      case "oldest": return "Cũ nhất";
      case "revenue": return "Doanh thu cao nhất";
      default: return "";
    }
  };

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
              <div className="relative overflow-hidden 
                bg-gradient-to-br from-emerald-100 to-teal-200
                rounded-3xl p-8 text-slate-800
                shadow-lg shadow-emerald-200/40
                hover:scale-[1.01] transition-transform duration-300">
                <p className="text-sm text-slate-600 font-medium">
                  Doanh thu Thực nhận
                </p>
                <p className="text-3xl font-bold mt-2 text-slate-900">
                  {formatMoney(summary.supplier_revenue)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Tổng từ {summary.total_orders} đơn
                </p>
              </div>

              {/* Tổng doanh thu */}
              <div className="relative overflow-hidden 
                bg-gradient-to-br from-violet-100 to-indigo-200
                rounded-3xl p-8 text-slate-800
                shadow-lg shadow-indigo-200/40
                hover:scale-[1.01] transition-transform duration-300">
                <p className="text-sm text-slate-600 font-medium">
                  Tổng Doanh thu
                </p>
                <p className="text-3xl font-bold mt-2 text-slate-900">
                  {formatMoney(summary.total_revenue)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Toàn bộ doanh thu
                </p>
              </div>

              {/* Admin Commission */}
              <div className="relative overflow-hidden 
                bg-gradient-to-br from-sky-100 to-blue-200
                rounded-3xl p-8 text-slate-800
                shadow-lg shadow-blue-200/40
                hover:scale-[1.01] transition-transform duration-300">
                <p className="text-sm text-slate-600 font-medium">
                  Hoa hồng nền tảng
                </p>
                <p className="text-3xl font-bold mt-2 text-slate-900">
                  {formatMoney(summary.admin_commission)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
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
              <div className="mt-8 pt-6 border-t text-center">
                <p className="text-sm text-gray-500 mb-4">Chưa có dữ liệu thanh toán chi tiết</p>
                <button 
                  className="w-full max-w-sm mx-auto py-3 px-6 rounded-2xl font-semibold 
                    bg-emerald-600 text-white hover:bg-emerald-700 
                    shadow-md shadow-emerald-200/50 active:scale-[0.98] transition-all"
                  onClick={() => alert("Yêu cầu rút tiền đã được gửi tới Admin!")}
                >
                  Liên hệ Admin để rút tiền
                </button>
              </div>
            </div>
          </>
        )}

        {/* Table với Filter */}
        <div className="bg-white border rounded-3xl overflow-hidden shadow-lg">
          {/* Filter Section */}
          <div className="p-8 border-b bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm tour..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl 
                    focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                    transition-all duration-200 bg-white/80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium hidden sm:block">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl 
                    focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                    bg-white shadow-sm hover:shadow-md transition-all duration-200
                    text-sm font-medium"
                >
                  <option value="revenue">Doanh thu cao nhất</option>
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>

              {/* Results count */}
              <div className="text-sm text-gray-500">
                {filteredTourRevenue.length} tour
              </div>
            </div>

            <h2 className="text-xl font-black text-gray-800 mt-4">
              Doanh thu theo Tour
            </h2>
            <p className="text-sm text-gray-500">
              {getSortLabel(sortBy)} • {filteredTourRevenue.length} kết quả
            </p>
          </div>

          {/* Table */}
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
                {filteredTourRevenue.map((tour) => (
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
                {filteredTourRevenue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p>Không tìm thấy tour nào</p>
                        <p className="text-xs">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}