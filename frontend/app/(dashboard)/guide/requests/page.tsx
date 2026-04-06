"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function GuideRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);

  const fetchRequests = () => {
    const token = localStorage.getItem("token");

    axios.get("http://localhost:5000/api/guide/requests", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setRequests(res.data))
      .catch((err) => {
        console.error("Lỗi load requests:", err);
        alert("Lỗi tải yêu cầu từ server!");
      });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (id: number, action: 'accept' | 'reject') => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/guide/requests/${id}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(action === 'accept'
        ? "Đã nhận tour! Chờ admin duyệt."
        : "Đã từ chối thành công."
      );

      fetchRequests();
    } catch (e: any) {
      const msg = e?.response?.data?.msg || "Lỗi hệ thống khi phản hồi yêu cầu";
      alert(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            Yêu cầu dẫn tour mới
          </h1>
          <p className="text-gray-500 mt-1">Quản lý các lời mời dẫn đoàn từ nhà cung cấp</p>
        </div>
        <div className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
          <span className="text-orange-600 font-bold text-sm">
            {requests.length} Lời mời chờ xử lý
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium text-lg">Hiện không có lời mời nào mới.</p>
          <p className="text-gray-400 text-sm italic">Hãy quay lại sau hoặc kiểm tra trạng thái hồ sơ của bạn.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((req) => {
            const canRespond = req.can_respond;
            const isWaitingAdmin = req.assign_status === 'accepted' && req.tour_status === 'pending';
            return (
              <div
                key={req.request_id}
                className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 border-l-[6px] border-orange-500 flex flex-col md:flex-row justify-between items-center transition-all hover:shadow-md"
              >
                <div className="mb-4 md:mb-0 w-full md:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black text-xl text-gray-800">
                      {req.name}
                    </h3>

                    {!canRespond && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-100 animate-pulse">
                         Đang chờ admin duyệt
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-gray-600 text-sm gap-2">
                      <span className="font-bold"> Khởi hành:</span> 
                      {new Date(req.start_date).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex items-center text-gray-400 text-[11px] gap-2">
                      <span className="font-bold uppercase tracking-widest"> Nhận lúc:</span> 
                      {new Date(req.assigned_date).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  {canRespond ? (
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => handleResponse(req.request_id, 'reject')}
                        className="flex-1 md:flex-none px-6 py-2.5 border-2 border-red-50 text-red-600 rounded-xl hover:bg-red-50 text-xs font-black uppercase tracking-widest transition-all"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleResponse(req.request_id, 'accept')}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5"
                      >
                        Đồng ý nhận
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 px-4 py-2 rounded-xl text-xs text-gray-400 font-bold italic border border-gray-100 w-full text-center">
                      Admin đang kiểm soát tour này...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}