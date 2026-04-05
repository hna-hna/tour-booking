"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Tour {
  id: number;
  name: string;
  price: number;
  quantity: number; 
  supplier_id: number;
  supplier_name?: string;
  start_date: string;
  end_date: string;
  created_at: string;
  status: string; 
}

export default function ApproveHistoryPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Gọi API lấy danh sách Tour lịch sử (Đã duyệt, Từ chối, Đã hủy)
  const fetchToursHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/tours/history");
      setTours(res.data);
    } catch (error) {
      console.error("Lỗi tải lịch sử tour:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToursHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">Đã Duyệt</span>;
      case 'rejected':
        return <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200">Đã Từ Chối</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-200">Đã Phê Duyệt Hủy</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{status}</span>;
    }
  };

  const filteredAndSortedTours = tours
    .filter(tour => statusFilter === "all" || tour.status === statusFilter)
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  // Giao diện khi đang tải dữ liệu
  if (loading) return (
    <div className="flex h-screen items-center justify-center font-black">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Lịch sử Duyệt Tour</h1>
          <p className="text-slate-500 font-bold italic mt-1 text-sm">Xem lại các yêu cầu duyệt tour đăng tải và hủy tour đã được xử lý</p>
        </div>
        
        {/* Quick Stats Card */}
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Kết quả hiển thị</p>
            <p className="text-2xl font-black text-slate-800">
              {filteredAndSortedTours.length} <span className="text-sm font-bold text-slate-500">yêu cầu</span>
            </p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select 
          className="bg-white border text-sm font-bold border-slate-200 text-slate-700 px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="approved">Đã Duyệt</option>
          <option value="rejected">Đã Từ Chối</option>
          <option value="cancelled">Đã Phê Duyệt Hủy</option>
        </select>

        <select 
          className="bg-white border text-sm font-bold border-slate-200 text-slate-700 px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Ngày cập nhật: Mới nhất</option>
          <option value="oldest">Ngày cập nhật: Cũ nhất</option>
        </select>
      </div>

      {/* Main Content */}
      {filteredAndSortedTours.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-[3rem] border border-slate-100">
            <p className="text-slate-400 font-black tracking-tight text-xl">Không tìm thấy yêu cầu nào phù hợp!</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-[2.5rem] overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin Tour</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày cập nhật</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAndSortedTours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-slate-800 transition-colors">
                        {tour.name}
                      </div>
                      <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-400 uppercase">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">ID: #{tour.id}</span>
                        {tour.start_date && <span>Khởi hành: {new Date(tour.start_date).toLocaleDateString('vi-VN')}</span>}
                        <span>NCC: #{tour.supplier_id}</span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-500 tracking-tighter">
                        {tour.created_at ? tour.created_at : "N/A"}
                      </span>
                    </td>

                    <td className="px-8 py-6 text-center">
                        {getStatusBadge(tour.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
