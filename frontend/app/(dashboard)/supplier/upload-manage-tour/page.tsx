"use client";
import React, { useEffect, useState } from "react";

export default function UploadManageTourPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // State quản lý Form
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    price: "",
    quantity: "",
    guide_name: "",
    itinerary: "",
    description: ""
  });

  // Lấy danh sách tour từ API
  const fetchTours = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/supplier/tours", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      
      // KIỂM TRA TOKEN HẾT HẠN
      if (res.status === 401) {
        alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!");
        localStorage.removeItem("token"); 
        window.location.href = "/login"; 
        return;
      }
      
      const data = await res.json();
      setTours(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải tour:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTours(); }, []);

  // Mở modal để tạo mới hoặc sửa
  const handleOpenModal = (tour: any = null) => {
    if (tour) {
      setFormData({ 
        ...tour,
        price: tour.price ? tour.price.toString() : "",
        quantity: tour.quantity ? tour.quantity.toString() : ""
      });
    } else {
      setFormData({ 
        id: null, 
        name: "", 
        price: "", 
        quantity: "", 
        guide_name: "", 
        itinerary: "", 
        description: "" 
      });
    }
    setIsModalOpen(true);
  };

  // HÀM SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUpdate = !!formData.id;
    
    const url = isUpdate 
      ? `http://localhost:5000/api/supplier/tours/${formData.id}` 
      : "http://localhost:5000/api/supplier/tours";
      
    const payload = {
      ...formData,
      price: Number(formData.price),
      quantity: Number(formData.quantity) || 20
    };  

    try {
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isUpdate ? "Cập nhật thành công!" : "Đã gửi tour chờ duyệt!");
        setIsModalOpen(false);
        fetchTours();
        return;
      } 

      // Xử lý lỗi
      const errorText = await res.text();
      try {
        const errorObj = JSON.parse(errorText);
        console.log(" Server Error Log:", errorObj);

        let message = "Có lỗi xảy ra";
        if (typeof errorObj === 'string') message = errorObj;
        else if (errorObj.msg) message = errorObj.msg;
        else if (errorObj.message) message = errorObj.message;
        else if (errorObj.error) message = errorObj.error;
        else if (errorObj.errors && Array.isArray(errorObj.errors)) {
           message = errorObj.errors.map((e: any) => e.msg).join(", ");
        } else {
           message = JSON.stringify(errorObj);
        }
        alert("Lỗi từ Server: " + message);
      } catch (parseError) {
        console.error("Non-JSON Response:", errorText);
        alert(`Lỗi hệ thống (${res.status}): ${res.statusText}`);
      }

    } catch (error) {
      console.error("Network Error:", error);
      alert("Không thể kết nối tới Server!");
    }
  };

  // Xử lý Xóa
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tour này?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/supplier/tours/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        alert("Đã xóa tour thành công!");
        fetchTours();
      } else {
        const error = await res.json();
        alert(error.msg || error.message || "Lỗi khi xóa");
      }
    } catch (e) {
      alert("Lỗi kết nối mạng");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white min-h-screen rounded-3xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
            Quản lý & Đăng tải Tour
          </h1>
          <p className="text-gray-400 text-sm">Quản lý lịch trình, HDV và giá tour của bạn</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Đăng Tour mới
        </button>
      </div>

      {/* DANH SÁCH TOUR */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 italic">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tours.map((t) => (
            <div 
              key={t.id || Math.random()} 
              className="group bg-gray-50 hover:bg-white border hover:border-emerald-200 p-6 rounded-3xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                    t.status === 'approved' ? 'bg-green-100 text-green-600' : 
                    t.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {t.status ? t.status.toUpperCase() : "CHỜ DUYỆT"}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs font-bold text-gray-500 uppercase">ID: #{t.id}</span>
                </div>
                <h3 className="text-lg font-black text-gray-800 group-hover:text-emerald-700 transition-colors">
                  {t.name}
                </h3>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                   <p className="text-sm text-gray-500 font-medium">
                      <span className="text-gray-800">{t.price?.toLocaleString() || 0}đ</span>
                   </p>
                   <p className="text-sm text-gray-500 font-medium">
                      HDV: <span className="text-gray-800">{t.guide_name || "Chưa phân công"}</span>
                   </p>
                   <p className="text-sm text-gray-500 font-medium">
                      Tối đa: <span className="text-gray-800">{t.quantity || 20} khách</span>
                   </p>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                {(t.status === 'pending' || t.status === 'rejected') ? (
                  <>
                    <button 
                      onClick={() => handleOpenModal(t)} 
                      className="flex-1 md:flex-none bg-blue-50 text-blue-600 px-5 py-2 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all"
                    >
                      CHỈNH SỬA
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)} 
                      className="flex-1 md:flex-none bg-red-50 text-red-600 px-5 py-2 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all"
                    >
                      XÓA
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400 bg-gray-100 px-4 py-2 rounded-xl italic text-[11px] font-medium uppercase">
                     Đang kinh doanh - Không thể sửa
                  </div>
                )}
              </div>
            </div>
          ))}
          {tours.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
              Bạn chưa đăng tải bất kỳ tour nào.
            </div>
          )}
        </div>
      )}

      {/* MODAL FORM (THÊM/SỬA) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 uppercase italic">
                {formData.id ? "Cập nhật Tour" : "Đăng ký Tour mới"}
              </h2>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Tên Tour du lịch
                </label>
                <input 
                  required 
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold text-gray-700" 
                  value={formData.name || ""} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Giá tour (VNĐ)
                </label>
                <input 
                  type="number" 
                  required 
                  min="0" 
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold" 
                  value={formData.price || ""} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Số lượng khách tối đa
                </label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold"
                  value={formData.quantity || ""} 
                  onChange={e => setFormData({...formData, quantity: e.target.value})} 
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Tên hướng dẫn viên phân công
                </label>
                <input 
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold" 
                  value={formData.guide_name || ""} 
                  onChange={e => setFormData({...formData, guide_name: e.target.value})} 
                  
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Lịch trình chi tiết
                </label>
                <textarea 
                  rows={6} 
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-medium text-sm" 
                  value={formData.itinerary || ""} 
                  onChange={e => setFormData({...formData, itinerary: e.target.value})} 
                  placeholder="" 
                />
              </div>

             
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-8 py-3 text-gray-400 font-bold uppercase text-xs tracking-widest hover:text-black"
              >
                Đóng
              </button>
              <button 
                type="button"
                onClick={handleSubmit} 
                className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-tighter hover:bg-gray-800 transition-all active:scale-95 shadow-xl"
              >
                {formData.id ? "Lưu thay đổi" : "Gửi yêu cầu duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}