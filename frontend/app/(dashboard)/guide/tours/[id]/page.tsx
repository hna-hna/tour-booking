//frontend/app/(dashboard)/guide/tours/[id]
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
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Hàm lấy Token để gửi kèm request (Header)
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "guide") {
        alert("Bạn không phải hướng dẫn viên!");
        router.push("/login");
    }
}, []);

  useEffect(() => {
    if (!tourId) return;

    // 1. Tải thông tin Tour
    axios.get(`http://localhost:5000/api/tours/${tourId}`)
      .then((res) => {
        let data = res.data;
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
    axios.get(`http://localhost:5000/api/guide/tours/${id}/customers`, {
      headers: getAuthHeader()
    })
      .then((res) => {
        console.log("Dữ liệu khách hàng trả về:", res.data);
        setCustomers(res.data);
        setCustomers(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("Lỗi tải Khách:", err))
      .finally(() => setLoadingCust(false));
  };

  const goToChat = (userId: number, name: string) => {
    router.push(`/guide/chat?partnerId=${userId}&name=${encodeURIComponent(name)}`);
  };

  const handleFinishTour = async () => {
    const confirmFinish = confirm("Xác nhận hoàn thành tour? Hành động này sẽ cập nhật trạng thái tour và tính toán doanh thu.");
    if (!confirmFinish) return;

    try {
      await axios.put(
        `http://localhost:5000/api/tours/${tourId}/finish`, 
        {}, 
        { headers: getAuthHeader() }
      );
      
      alert("🎉 Chúc mừng bạn đã hoàn thành tour!");
      
      window.location.reload(); 
    } catch (error) {
      alert("Lỗi: Không thể hoàn thành tour. Vui lòng kiểm tra lại quyền truy cập.");
      console.error(error);
    }
  };

  if (!tourId) return <div className="p-8 text-center">Đang đọc URL...</div>;
  if (!tour) return <div className="p-8 text-center font-medium">Đang tải dữ liệu tour...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 relative">
      
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="w-2/3">
            <h1 className="text-3xl font-bold text-gray-800">{tour.name}</h1>
            
            {tour.status !== 'completed' ? (
              <button 
                onClick={handleFinishTour}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                HOÀN THÀNH TOUR
              </button>
            ) : (
              <div className="mt-4 inline-block px-4 py-1.5 bg-gray-100 text-gray-500 rounded-lg font-bold border border-gray-200">
                TOUR ĐÃ KẾT THÚC
              </div>
            )}
          </div>
          
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
            tour.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {tour.status === 'completed' ? 'Đã hoàn thành' : 'Đang phụ trách'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
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
            <h3 className="font-bold text-blue-800 mb-3 sticky top-0 bg-blue-50/10 backdrop-blur-md pb-2 uppercase text-sm">Lịch trình di chuyển</h3>
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

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Hành khách trong đoàn
              <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full">{customers.length}</span>
            </h2>
          </div>
          <button onClick={() => loadCustomers(tourId)} className="text-sm font-bold text-emerald-600 hover:underline">
            Làm mới danh sách
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Hành khách</th>
                 <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Liên hệ</th>
                 <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Thao tác</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((cus) => (
                <tr key={cus.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {cus.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{cus.full_name}</p>
                      <p className="text-[10px] text-gray-400">ID: #{cus.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{cus.phone}</p>
                    <p className="text-[10px] text-gray-400">{cus.email}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => goToChat(cus.id, cus.full_name)} 
                        className="px-3 py-1 rounded bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold"
                      >
                        Nhắn tin
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}