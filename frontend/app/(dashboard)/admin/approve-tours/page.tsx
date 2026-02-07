/* app/(dashboard)/admin/approve-tours/page.tsx */
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Tour {
  id: number;
  name: string;
  price: number;
  supplier_id: number;
  created_at?: string; 
  supplier_name?: string; 
}

export default function ApproveToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách pending
  const fetchPendingTours = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/tours/pending");
      setTours(res.data);
    } catch (error) {
      console.error("Lỗi tải tour:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTours();
  }, []);

  // Xử lý Duyệt/Từ chối
  const handleStatusChange = async (id: number, status: "approved" | "rejected") => {
    if (!confirm(`Bạn chắc chắn muốn ${status === "approved" ? "DUYỆT" : "TỪ CHỐI"} tour này?`)) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/tours/${id}/moderate`, {
        action: status === "approved" ? "approve" : "reject",
      });
      // Tự động xóa dòng vừa xử lý khỏi danh sách (để giao diện mượt hơn đỡ phải load lại API)
      setTours(tours.filter((t) => t.id !== id));
      alert("Xử lý thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  if (loading) return <div className="p-10 text-center text-emerald-600 font-bold">Đang tải danh sách...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Kiểm duyệt Tour</h1>
        <p className="text-gray-500 mt-2">Danh sách các tour mới chờ phê duyệt từ nhà cung cấp</p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-400 to-black-500 rounded-2xl p-6 text-white shadow-lg">
          <p className="opacity-90 text-sm font-medium">Yêu cầu chờ duyệt</p>
          <p className="text-3xl font-bold mt-2">{tours.length}</p>
          <div className="mt-4 text-xs bg-white/20 inline-block px-2 py-1 rounded"> Cần xử lý ngay</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {tours.length === 0 ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center">
            <span className="text-4xl mb-3"></span>
            <p>Tuyệt vời! Không còn tour nào đang chờ duyệt.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin Tour</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá đề xuất</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhà cung cấp (ID)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                          T{tour.id}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
                            {tour.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Ngày tạo: {tour.created_at ? new Date(tour.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-700">
                        {tour.price.toLocaleString()} 
                      </span>
                      <span className="text-xs text-gray-400 ml-1">VND</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        Provider #{tour.supplier_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleStatusChange(tour.id, "approved")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1"
                        >
                          <span>✓</span> Duyệt
                        </button>
                        <button
                          onClick={() => handleStatusChange(tour.id, "rejected")}
                          className="px-3 py-1.5 bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 text-xs font-medium rounded-lg transition-all flex items-center gap-1"
                        >
                          <span>✕</span> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}