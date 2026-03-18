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

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Kiểm duyệt Tour</h1>
          <p className="text-gray-500 font-bold italic mt-1">Phê duyệt nội dung từ nhà cung cấp</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tổng giá trị chờ</p>
            <p className="text-2xl font-black text-gray-800">
              {tours.reduce((sum, t) => sum + (t.price * t.quantity), 0).toLocaleString()} <span className="text-sm">đ</span>
            </p>
          </div>
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-[3rem] shadow-2xl border border-gray-100">
           <p className="text-gray-400 font-black tracking-tight text-xl"> Không có tour nào cần duyệt!</p>
        </div>
      ) : (
        <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thông tin Tour</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Giá & SL</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhà cung cấp</th>
                  <th className="px-8 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors">{tour.name}</div>
                      <div className="flex gap-4 mt-1 text-[10px] font-bold text-gray-400 uppercase">
                        <span> {new Date(tour.start_date).toLocaleDateString('vi-VN')}</span>
                        <span>ID: #{tour.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-gray-800">{tour.price.toLocaleString()} đ</div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Tồn kho: {tour.quantity}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                        {tour.supplier_name || `Supplier ${tour.supplier_id}`}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleStatusChange(tour.id, "approved")}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                          Duyệt
                        </button>
                        <button 
                          onClick={() => handleStatusChange(tour.id, "rejected")}
                          className="bg-white border border-gray-200 text-rose-500 hover:bg-rose-50 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                          Từ chối
                        </button>
                      </div>
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