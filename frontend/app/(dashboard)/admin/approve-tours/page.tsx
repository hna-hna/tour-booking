/*(dashboard)/admin/approve-tours/page.tsx*/
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios"; // Đảm bảo đã npm install axios

// Định nghĩa kiểu dữ liệu cho Tour (cơ bản)
interface Tour {
  id: number;
  name: string;
  price: number;
  provider_id: number;
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
    if(!confirm(`Bạn chắc chắn muốn ${status === "approved" ? "DUYỆT" : "TỪ CHỐI"} tour này?`)) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/tours/${id}/status`, { status });
      alert("Thành công!");
      // Tải lại danh sách để mất dòng vừa duyệt
      fetchPendingTours(); 
    } catch (error) {
      alert("Có lỗi xảy ra");
    }
  };

  if (loading) return <div className="p-8">Đang tải...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Kiểm duyệt Tour (Pending)</h1>
      
      {tours.length === 0 ? (
        <p>Không có tour nào đang chờ duyệt.</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Tour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tours.map((tour) => (
                <tr key={tour.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{tour.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tour.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tour.price.toLocaleString()} đ</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleStatusChange(tour.id, "approved")}
                      className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition"
                    >
                      Duyệt
                    </button>
                    <button 
                      onClick={() => handleStatusChange(tour.id, "rejected")}
                      className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
                    >
                      Từ chối
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}