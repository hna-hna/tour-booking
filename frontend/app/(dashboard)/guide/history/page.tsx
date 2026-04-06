"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Link from "next/link";

export default function GuideTourHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE BỔ SUNG ĐỂ LỌC ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(""); // Lọc theo ngày phân công (YYYY-MM-DD)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Không tìm thấy token. Vui lòng đăng nhập lại.");
          setLoading(false);
          return;
        }

        const res = await axios.get("http://127.0.0.1:5000/api/guide/tours/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setHistory(res.data);
      } catch (err) {
        console.error("Lỗi tải lịch sử tour:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, []);

  // --- LOGIC LỌC DỮ LIỆU ---
  // Dùng useMemo để tối ưu hiệu năng, chỉ tính toán lại khi history hoặc điều kiện lọc thay đổi
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // 1. Lọc theo tên tour (không phân biệt hoa thường)
      const matchesName = item.tour_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // 2. Lọc theo ngày phân công (so sánh chuỗi ngày YYYY-MM-DD)
      let matchesDate = true;
      if (filterDate && item.assigned_date) {
        const assignedDateStr = new Date(item.assigned_date).toISOString().split('T')[0];
        matchesDate = assignedDateStr === filterDate;
      }

      return matchesName && matchesDate;
    });
  }, [history, searchTerm, filterDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 italic text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mr-3"></div>
        Đang tải lịch sử hành trình...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Lịch sử Tour</h1>
          <p className="text-gray-500 mt-1">Các tour bạn đã dẫn dắt và đồng hành</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full shadow-sm">
            Kết quả: {filteredHistory.length} / {history.length} Tour
          </span>
        </div>
      </div>

      {/* --- THANH BỘ LỌC (SEARCH & FILTER) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Tìm kiếm tên tour</label>
          <input
            type="text"
            placeholder="Nhập tên tour cần tìm..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Lọc theo ngày phân công</label>
          <input
            type="date"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate("")}
              className="absolute right-3 top-8 text-xs text-gray-400 hover:text-red-500"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Grid Danh sách */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl p-20 text-center border border-dashed border-gray-300">
          <p className="text-gray-400 font-medium">Không tìm thấy tour nào khớp với điều kiện lọc.</p>
          <button 
            onClick={() => {setSearchTerm(""); setFilterDate("");}}
            className="text-cyan-600 text-sm hover:underline mt-4 block mx-auto"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Mã phân công: #{item.id}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    item.status === 'completed' || item.status === 'finished' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.status === 'completed' ? 'Hoàn thành' : 'Đã kết thúc'}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 text-lg mb-3 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                  {item.tour_name}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-500 gap-3">
                    <span className="font-medium text-gray-400"> Khởi hành:</span>
                    <span className="text-gray-700">{item.start_date ? new Date(item.start_date).toLocaleDateString('vi-VN') : "N/A"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 gap-3">
                    <span className="font-medium text-gray-400"> Địa điểm:</span>
                    <span className="truncate text-gray-700">{item.location || "Việt Nam"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="text-[10px] text-gray-400 font-medium italic">
                    Giao ngày: {item.assigned_date ? new Date(item.assigned_date).toLocaleDateString('vi-VN') : "N/A"}
                  </div>
                  <Link 
                    href={`/guide/tours/${item.tour_id}`}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1"
                  >
                    Chi tiết <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}