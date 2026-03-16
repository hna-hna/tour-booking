/* app/(dashboard)/admin/approve-tours/page.tsx */
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Tour {
  id: number;
  name: string;
  price: number;
  quantity: number; // Thêm số lượng
  supplier_id: number;
  supplier_name?: string;
  start_date: string; // Thêm ngày đi
  end_date: string;
  created_at: string;
}

export default function ApproveToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleStatusChange = async (id: number, status: "approved" | "rejected") => {
    if (!confirm(`Bạn chắc chắn muốn ${status === "approved" ? "DUYỆT" : "TỪ CHỐI"} tour này?`)) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/tours/${id}/moderate`, {
        action: status === "approved" ? "approve" : "reject",
      });
      setTours(tours.filter((t) => t.id !== id));
      alert("Xử lý thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  if (loading) return <div className="p-10 text-center text-emerald-600 font-bold">Đang tải danh sách...</div>;

  return (
    <div className="p-6 text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kiểm duyệt Tour & Ước tính Doanh thu</h1>
        <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg font-bold">
          Tổng giá trị chờ duyệt: {tours.reduce((sum, t) => sum + (t.price * t.quantity), 0).toLocaleString()} đ
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-xl shadow border">
           <p className="text-gray-500 italic">Không có tour nào đang chờ duyệt.</p>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tour</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ngày đi/về</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Giá vé</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Số lượng</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nhà cung cấp</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Doanh thu dự kiến</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tours.map((tour) => {
                const totalRevenue = tour.price * tour.quantity; // Tính toán doanh thu dự kiến
                return (
                  <tr key={tour.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-gray-900">{tour.name}</div>
                      <div className="text-xs text-gray-400">ID: #{tour.id}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600">
                      <div>Ngày đi: {new Date(tour.start_date).toLocaleDateString('vi-VN')}</div>
                      <div>Ngày về: {new Date(tour.end_date).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 font-medium">
                      {tour.price.toLocaleString()} đ
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">
                      {tour.quantity}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600"><span className="font-medium">{tour.supplier_name}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-blue-600">
                      {totalRevenue.toLocaleString()} đ
                    </td>
                    <td className="px-4 py-4 text-center space-x-2">
                      <button 
                        onClick={() => handleStatusChange(tour.id, "approved")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition shadow-sm"
                      >
                        Duyệt
                      </button>
                      <button 
                        onClick={() => handleStatusChange(tour.id, "rejected")}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-1.5 rounded-lg text-sm font-bold transition"
                      >
                        Từ chối
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}