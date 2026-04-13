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

  useEffect(() => {
    if (!tourId) return;

    axios
      .get(`http://localhost:5000/api/tours/${tourId}`)
      .then((res) => {
        let data = res.data;

        if (data && typeof data.itinerary === "string") {
          try {
            data.itinerary = JSON.parse(data.itinerary);
          } catch {
            data.itinerary = [];
          }
        }
        setTour(data);
      })
      .catch((err) => console.error("Lỗi tải Tour:", err));

    loadCustomers(tourId);
  }, [tourId]);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadCustomers = (id: string | string[]) => {
    setLoadingCust(true);
    axios
      .get(`http://localhost:5000/api/guide/tours/${id}/customers`, {
        headers: getAuthHeader(),
      })
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
    const confirmFinish = confirm("Xác nhận hoàn thành tour?");
    if (!confirmFinish) return;

    try {
      await axios.put(`http://localhost:5000/api/guide/tours/${params.id}/finish`,
      {},
      { headers: getAuthHeader() });
      alert(" Chúc mừng bạn đã hoàn thành tour!");
      router.push("/guide/profile");
    } catch (error) {
      alert("Lỗi: Không thể hoàn thành tour.");
      console.error(error);
    }
  };

  if (!tourId) return <div className="p-8 text-center">Đang đọc URL...</div>;
  if (!tour)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <p className="text-lg text-gray-500 font-medium">Đang tải dữ liệu tour...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-10 px-6">
      <div className="max-w-7xl mx-auto transition-all duration-300">

        {/* HEADER */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
              {tour.name}
            </h1>
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest
              bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-300/40">
              Đang phụ trách
            </span>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Chi tiết tour và danh sách hành khách
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-100 to-blue-200 rounded-3xl p-8 text-slate-800 shadow-lg shadow-blue-200/40 hover:scale-[1.01] transition-transform duration-300">
            <p className="text-sm text-slate-600 font-medium">Ngày bắt đầu</p>
            <p className="text-3xl font-bold mt-2 text-slate-900">
              {tour.start_date ? new Date(tour.start_date).toLocaleDateString("vi-VN") : "---"}
            </p>
            <p className="text-xs text-slate-500 mt-2">Khởi hành chính thức</p>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-200 rounded-3xl p-8 text-slate-800 shadow-lg shadow-indigo-200/40 hover:scale-[1.01] transition-transform duration-300">
            <p className="text-sm text-slate-600 font-medium">Ngày kết thúc</p>
            <p className="text-3xl font-bold mt-2 text-slate-900">
              {tour.end_date ? new Date(tour.end_date).toLocaleDateString("vi-VN") : "---"}
            </p>
            <p className="text-xs text-slate-500 mt-2">Dự kiến hoàn thành</p>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-200 rounded-3xl p-8 text-slate-800 shadow-lg shadow-emerald-200/40 hover:scale-[1.01] transition-transform duration-300">
            <p className="text-sm text-slate-600 font-medium">Số hành khách</p>
            <p className="text-3xl font-bold mt-2 text-slate-900">{customers.length} người</p>
            <p className="text-xs text-slate-500 mt-2">Đã xác nhận tham gia</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-black text-gray-800 mb-4">Mô tả / Địa điểm</h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              {tour.description || "Không có mô tả tour"}
            </p>

            <div className="mt-8">
              <button
                onClick={handleFinishTour}
                className="w-full py-4 rounded-2xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 shadow-md shadow-emerald-200/50 active:scale-[0.98]"
              >
                Hoàn thành tour
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">
                Hành động này không thể hoàn tác sau khi xác nhận
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-black text-gray-800 mb-4">Lịch trình di chuyển</h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {Array.isArray(tour.itinerary) && tour.itinerary.length > 0 ? (
                tour.itinerary.map((day: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-blue-50/60 transition"
                  >
                    
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{day.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{day.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic text-center mt-16">
                  Chưa có thông tin lịch trình.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-lg">
          <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-gray-800">Danh sách Hành khách</h2>
              <p className="text-sm text-gray-500 mt-1">{customers.length} hành khách đã đăng ký</p>
            </div>
            <button
              onClick={() => loadCustomers(tourId)}
              disabled={loadingCust}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-2xl text-sm font-bold shadow-sm transition"
            >
              {loadingCust ? "Đang tải..." : " Làm mới"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-4 text-left font-black text-gray-500 uppercase text-xs tracking-wider">Hành khách</th>
                  <th className="px-6 py-4 text-left font-black text-gray-500 uppercase text-xs tracking-wider">Liên hệ</th>
                  <th className="px-6 py-4 text-left font-black text-gray-500 uppercase text-xs tracking-wider">Ghi chú</th>
                  <th className="px-6 py-4 text-right font-black text-gray-500 uppercase text-xs tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((cus) => (
                  <tr key={cus.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4 font-bold text-gray-800">{cus.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <p className="text-sm">{cus.phone}</p>
                      <p className="text-xs text-gray-400">{cus.email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {cus.note || <span className="italic text-gray-300">Trống</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => viewCustomerProfile(cus)}
                        className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition"
                      >
                        Hồ sơ
                      </button>
                      <button
                        onClick={() => goToChat(cus.id, cus.full_name)}
                        className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-300/30 hover:scale-105 transition"
                      >
                        Chat
                      </button>
                    </td>
                  </tr>
                ))}

                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-gray-400 italic text-sm">
                      Không tìm thấy hành khách nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== MODAL HỒ SƠ KHÁCH HÀNG ==================== */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">

            <div className="mb-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-4xl shadow-lg mb-4">
                {selectedCustomer.full_name?.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-gray-900">
                {selectedCustomer.full_name}
              </h2>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-gray-800 font-medium">{selectedCustomer.email}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                <p className="text-gray-800 font-medium">{selectedCustomer.phone || "Chưa có"}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-2xl font-bold text-sm transition"
              >
                Đóng
              </button>

              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  goToChat(selectedCustomer.id, selectedCustomer.full_name);
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.02] transition"
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