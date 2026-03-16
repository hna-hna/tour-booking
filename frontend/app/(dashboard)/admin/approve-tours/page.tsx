/* app/(dashboard)/admin/approve-tours/page.tsx */
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Tour {
  id: number;
  name: string;
  price: number;
  quantity: number; // Số lượng chỗ từ HEAD
  supplier_id: number;
  supplier_name?: string;
  start_date: string; // Ngày đi từ HEAD
  end_date: string;
  created_at: string;
}

export default function ApproveToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách các tour đang chờ duyệt (Pending)
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

  // Xử lý Duyệt hoặc Từ chối tour
  const handleStatusChange = async (id: number, status: "approved" | "rejected") => {
    if (!confirm(`Bạn chắc chắn muốn ${status === "approved" ? "DUYỆT" : "TỪ CHỐI"} tour này?`)) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/tours/${id}/moderate`, {
        action: status === "approved" ? "approve" : "reject",
      });
      
      // Cập nhật State tại chỗ để giao diện mượt hơn (không cần gọi lại API)
      setTours(tours.filter((t) => t.id !== id));
      alert("Xử lý thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  if (loading) return (
    <div className="p-10 text-center text-emerald-600 font-bold animate-pulse">
      Đang tải danh sách kiểm duyệt...
    </div>
  );

  return (
    <div className="p-6 text-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kiểm duyệt Tour</h1>
          <p className="text-gray-500 mt-1">Quản lý và phê duyệt các tour mới từ nhà cung cấp</p>
        </div>
        
        {/* Widget Ước tính doanh thu từ HEAD */}
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-6 py-4 rounded-2xl shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Tổng giá trị chờ duyệt</p>
          <p className="text-2xl font-black">
            {tours.reduce((sum, t) => sum + (t.price * t.quantity), 0).toLocaleString()} đ
          </p>
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-[2rem] shadow-sm border border-dashed border-gray-300">
           <div className="text-5xl mb-4 text-gray-300">📄</div>
           <p className="text-gray-500 font-medium italic">Hiện không có tour nào đang chờ xử lý.</p>
        </div>
      ) : (
        <div className="bg-white shadow-2xl rounded-[1.5rem] overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Thông tin Tour</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Lịch trình</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Giá & SL</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Nhà cung cấp</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-blue-600 uppercase tracking-widest">Doanh thu dự kiến</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {tours.map((tour) => {
                  const totalRevenue = tour.price * tour.quantity;
                  return (
                    <tr key={tour.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1">{tour.name}</div>
                        <div className="text-[10px] font-mono text-gray-400 mt-1">ID: #{tour.id}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-500">🛫</span> {new Date(tour.start_date).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-rose-400">🛬</span> {new Date(tour.end_date).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-gray-700">{tour.price.toLocaleString()} đ</div>
                        <div className="text-xs text-gray-400 italic">SL: {tour.quantity} chỗ</div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded-md font-medium text-gray-700">
                          {tour.supplier_name || `ID: ${tour.supplier_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-black text-blue-600">
                          {totalRevenue.toLocaleString()} đ
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleStatusChange(tour.id, "approved")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 active:scale-95"
                          >
                            Duyệt
                          </button>
                          <button 
                            onClick={() => handleStatusChange(tour.id, "rejected")}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}