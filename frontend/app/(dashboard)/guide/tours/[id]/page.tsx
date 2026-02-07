//frontend/app/dashboard/guide/tours/[id]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";

export default function GuideTourDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params?.id;

  const [tour, setTour] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCust, setLoadingCust] = useState(false);
  
  // State quản lý Modal hồ sơ khách hàng (Cách B)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    if (!tourId) return;

    // 1. Tải thông tin Tour
    axios.get(`http://localhost:5000/api/tours/${tourId}`)
      .then((res) => {
        let data = res.data;
        // Xử lý lỗi itinerary.map: Parse string thành Array nếu cần
        if (data && typeof data.itinerary === 'string') {
          try {
            data.itinerary = JSON.parse(data.itinerary);
          } catch (e) {
            data.itinerary = [];
          }
        }
        setTour(data);
      })
      .catch((err) => console.error("Lỗi tải Tour:", err));
      
    // 2. Tải danh sách khách hàng
    loadCustomers(tourId);
  }, [tourId]);

  const loadCustomers = (id: string | string[]) => {
    setLoadingCust(true);
    axios.get(`http://localhost:5000/api/guide/tours/${id}/customers`)
      .then((res) => {
        setCustomers(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("Lỗi tải Khách:", err))
      .finally(() => setLoadingCust(false));
  };

  const goToChat = (userId: number, name: string) => {
    router.push(`/guide/chat?partnerId=${userId}&name=${encodeURIComponent(name)}`);
  };

  const viewCustomerProfile = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleFinishTour = async () => {
    const confirmFinish = confirm("Xác nhận hoàn thành tour? Hành động này sẽ cập nhật trạng thái tour và tính toán doanh thu.");
    if (!confirmFinish) return;

    try {
        await axios.put(`http://localhost:5000/api/guide/tours/${params.id}/finish`);
        alert("🎉 Chúc mừng bạn đã hoàn thành tour!");
        
        // Chuyển hướng về trang lịch sử hoặc load lại trang
        router.push("/guide/profile"); // Hoặc reload lại trang này
    } catch (error) {
        alert("Lỗi: Không thể hoàn thành tour.");
        console.error(error);
    }
};
  if (!tourId) return <div className="p-8 text-center">Đang đọc URL...</div>;
  if (!tour) return <div className="p-8 text-center font-medium">Đang tải dữ liệu tour...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 relative">
      
      {/* --- KHỐI 1: THÔNG TIN TOUR CHI TIẾT --- */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-800 w-2/3">{tour.name}</h1>
          <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
            Đang phụ trách
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 font-bold uppercase mb-2">Thời gian</p>
                <div className="flex gap-10">
                   <div>
                      <span className="text-xs text-gray-400">Bắt đầu</span>
                      <p className="font-bold text-gray-800">
                        {tour.start_date ? new Date(tour.start_date).toLocaleDateString('vi-VN') : '---'}
                      </p>
                   </div>
                   <div>
                      <span className="text-xs text-gray-400">Kết thúc</span>
                      <p className="font-bold text-gray-800">
                        {tour.end_date ? new Date(tour.end_date).toLocaleDateString('vi-VN') : '---'}
                      </p>
                   </div>
                </div>
             </div>
             <div>
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">Mô tả / Địa điểm</p>
                <p className="text-gray-700 leading-relaxed">{tour.description}</p>
             </div>
          </div>
          
          <div className="bg-blue-50/50 p-4 rounded-2xl h-72 overflow-y-auto border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-3 sticky top-0 bg-blue-50/10 backdrop-blur-md pb-2"> LỊCH TRÌNH DI CHUYỂN</h3>
            {Array.isArray(tour.itinerary) && tour.itinerary.length > 0 ? (
              <ul className="space-y-3">
                {tour.itinerary.map((day: any, idx: number) => (
                  <li key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-blue-50">
                    <p className="font-bold text-blue-600 text-sm">Ngày {day.day || idx + 1}: {day.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{day.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic text-center mt-10">Chưa có thông tin lịch trình.</p>
            )}
          </div>
        </div>
      </div>

      {/* --- KHỐI 2: QUẢN LÝ KHÁCH HÀNG --- */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Danh sách Hành khách
              <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full">{customers.length}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">Quản lý liên lạc và hồ sơ hành khách trong đoàn</p>
          </div>
          
          <button 
            onClick={() => loadCustomers(tourId)}
            disabled={loadingCust}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {loadingCust ? "⏳ Đang tải..." : "Làm mới"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Hành khách</th>
                 <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Liên hệ</th>
                 <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Ghi chú</th>
                 <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Thao tác</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((cus) => (
                <tr key={cus.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                        {cus.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{cus.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">ID: #{cus.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                      <p className="flex items-center gap-1"> {cus.phone}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400"> {cus.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs max-w-[150px] truncate">
                      {cus.note || <span className="text-gray-300 italic">Trống</span>}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => viewCustomerProfile(cus)} 
                        className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all"
                      >
                        📄 Hồ sơ
                      </button>
                      <button 
                        onClick={() => goToChat(cus.id, cus.full_name)} 
                        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all shadow-cyan-100"
                      >
                        💬 Chat
                      </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-gray-400 italic">Không tìm thấy khách hàng nào trong hệ thống.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL HỒ SƠ KHÁCH HÀNG (CÁCH B) --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedCustomer(null)}
          ></div>
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-600 p-8 text-white">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
              >
                ✕
              </button>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white text-emerald-600 flex items-center justify-center text-3xl font-black shadow-lg">
                  {selectedCustomer.full_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCustomer.full_name}</h2>
                  <p className="text-emerald-100 text-sm opacity-80">Khách hàng hệ thống #{selectedCustomer.id}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">📧</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Email liên hệ</p>
                  <p className="text-gray-700 font-medium">{selectedCustomer.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"></div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Số điện thoại</p>
                  <p className="text-gray-700 font-medium">{selectedCustomer.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">📝</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Ghi chú đoàn</p>
                  <p className="text-gray-600 text-sm italic leading-relaxed">
                    {selectedCustomer.note || "Khách hàng không có ghi chú đặc biệt cho tour này."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-4">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-2xl transition-all"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                   setSelectedCustomer(null);
                   goToChat(selectedCustomer.id, selectedCustomer.full_name);
                }}
                className="flex-1 py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-2xl transition-all shadow-lg shadow-emerald-100 active:scale-95"
              >
                Nhắn tin ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}