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

export default function ApproveToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTourId, setRejectTourId] = useState<number | null>(null);
  const [rejectStatus, setRejectStatus] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");

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

  // 2. Xử lý Duyệt hoặc Từ chối (Tự động nhận diện API theo status)
  const handleStatusChange = async (id: number, currentStatus: string, action: "approve" | "reject") => {
    if (action === "reject") {
        setRejectTourId(id);
        setRejectStatus(currentStatus);
        setRejectReason("");
        setRejectModalOpen(true);
        return;
    }

    const isCancelRequest = currentStatus === "cancel_requested";
    const url = isCancelRequest 
        ? `http://localhost:5000/api/admin/tours/${id}/cancel` 
        : `http://localhost:5000/api/admin/tours/${id}/moderate`;

    const displayMsg = isCancelRequest ? "ĐỒNG Ý HỦY" : "DUYỆT ĐĂNG";

    if (!confirm(`Bạn chắc chắn muốn ${displayMsg} tour này?`)) return;

    try {
      await axios.put(url, { action: "approve" });
      setTours(tours.filter((t) => t.id !== id));
      alert("Xử lý thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  const submitReject = async () => {
    if (!rejectTourId) return;
    
    const isCancelRequest = rejectStatus === "cancel_requested";
    const url = isCancelRequest 
        ? `http://localhost:5000/api/admin/tours/${rejectTourId}/cancel` 
        : `http://localhost:5000/api/admin/tours/${rejectTourId}/moderate`;

    try {
      const payload: any = { action: "reject", reject_reason: rejectReason };
      await axios.put(url, payload);
      
      setTours(tours.filter((t) => t.id !== rejectTourId));
      setRejectModalOpen(false);
      alert("Đã từ chối tour!");
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  // Giao diện khi đang tải dữ liệu
  if (loading) return (
    <div className="flex h-screen items-center justify-center font-black">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Kiểm duyệt Tour</h1>
          <p className="text-gray-500 font-bold italic mt-1">Phê duyệt nội dung mới và yêu cầu hủy từ NCC</p>
        </div>
        
        {/* Quick Stats Card */}
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tổng giá trị chờ duyệt</p>
            <p className="text-2xl font-black text-gray-800">
              {tours.reduce((sum, t) => sum + (t.price * t.quantity), 0).toLocaleString()} <span className="text-sm">đ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {tours.length === 0 ? (
        <div className="bg-white p-20 text-center rounded-[3rem] shadow-2xl border border-gray-100">
            <p className="text-gray-400 font-black tracking-tight text-xl">Hiện không còn yêu cầu nào cần phê duyệt!</p>
        </div>
      ) : (
        <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thông tin Tour</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loại Yêu Cầu</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhà cung cấp</th>
                  <th className="px-8 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors">
                        {tour.name}
                      </div>
                      <div className="flex gap-4 mt-1 text-[10px] font-bold text-gray-400 uppercase">
                        <span> Khởi hành: {new Date(tour.start_date).toLocaleDateString('vi-VN')}</span>
                        <span>ID: #{tour.id}</span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                        {tour.status === "cancel_requested" ? (
                            <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Yêu cầu hủy</span>
                        ) : (
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Đăng ký mới</span>
                        )}
                    </td>

                    <td className="px-8 py-6">
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                        {tour.supplier_name || `NCC #${tour.supplier_id}`}
                      </span>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleStatusChange(tour.id, tour.status, "approve")}
                          className={`${tour.status === 'cancel_requested' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'} text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95`}
                        >
                          {tour.status === 'cancel_requested' ? 'Duyệt Hủy' : 'Duyệt Đăng'}
                        </button>
                        <button 
                          onClick={() => handleStatusChange(tour.id, tour.status, "reject")}
                          className="bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
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

      {/* MODAL TỪ CHỐI TOUR */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-2">Nhập lý do từ chối</h2>
            <p className="text-sm text-gray-500 mb-6">Lý do này sẽ được gửi tới Nhà cung cấp để họ tham khảo chỉnh sửa.</p>
            
            <textarea
              rows={4}
              placeholder="VD: Lịch trình chưa rõ ràng, giá tour chưa hợp lý..."
              className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-medium text-sm text-gray-800 mb-6"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={submitReject}
                className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}