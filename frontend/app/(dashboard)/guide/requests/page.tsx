//frontend/app/dashboard/guide/requests/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function GuideRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = () => {
    axios.get("http://localhost:5000/api/guide/requests")
      .then((res) => setRequests(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (id: number, action: 'accept' | 'reject') => {
    try {
      await axios.put(`http://localhost:5000/api/guide/requests/${id}/respond`, { action });
      alert(action === 'accept' ? "Đã nhận tour! Kiểm tra lịch của bạn." : "Đã từ chối.");
      fetchRequests(); // Load lại danh sách
    } catch (e) { alert("Lỗi hệ thống"); }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yêu cầu dẫn tour mới </h1>
      
      {requests.length === 0 ? (
        <p className="text-gray-500">Hiện không có lời mời nào.</p>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.request_id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{req.name}</h3>
                <p className="text-gray-600 text-sm"> Khởi hành: {new Date(req.start_date).toLocaleDateString('vi-VN')}</p>
                <p className="text-gray-500 text-xs mt-1">Nhận yêu cầu lúc: {new Date(req.assigned_date).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleResponse(req.request_id, 'reject')}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-bold"
                >
                  Từ chối
                </button>
                <button 
                  onClick={() => handleResponse(req.request_id, 'accept')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold shadow-lg"
                >
                  Đồng ý nhận
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}