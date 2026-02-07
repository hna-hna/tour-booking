"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function GuideProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Trạng thái khi đang gọi API lưu
  
  // Dữ liệu form khi sửa
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  const fetchProfile = () => {
    axios.get("http://localhost:5000/api/guide/profile")
      .then((res) => {
        setProfile(res.data);
        setFormData({
          full_name: res.data.full_name || "",
          phone: res.data.phone || ""
        });
      })
      .catch((err) => {
        console.error("Lỗi lấy hồ sơ:", err);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    // Kiểm tra dữ liệu trống cơ bản
    if (!formData.full_name.trim()) {
      alert("Vui lòng nhập họ và tên");
      return;
    }

    setIsSaving(true);
    try {
      await axios.put("http://localhost:5000/api/guide/profile", formData);
      
      // Cập nhật thành công
      setProfile({ ...profile, ...formData }); 
      setIsEditing(false);
      alert("Cập nhật thông tin thành công! ");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Lỗi cập nhật. Vui lòng kiểm tra lại kết nối server.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      <span className="ml-3 text-gray-500 font-medium">Đang tải hồ sơ...</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-r from-cyan-600 to-blue-600 relative">
           <div className="absolute -bottom-12 left-8">
              <div className="w-28 h-28 bg-white rounded-3xl p-1 shadow-xl rotate-3">
                 <div className="w-full h-full bg-cyan-50 rounded-2xl flex items-center justify-center text-5xl">
                  
                 </div>
              </div>
           </div>
        </div>

        <div className="pt-16 px-8 pb-8">
           <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
              <div>
                 <h2 className="text-3xl font-bold text-gray-800">{profile.full_name}</h2>
                 <p className="text-cyan-600 font-semibold flex items-center gap-2 mt-1">
                   <span className="w-2 h-2  rounded-full animate-pulse"></span>
                   Hướng dẫn viên chuyên nghiệp
                 </p>
              </div>
              
              {/* Nút điều khiển */}
              {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 border border-gray-200 transition-all flex items-center gap-2 active:scale-95"
                  >
                     Chỉnh sửa hồ sơ
                  </button>
              ) : (
                  <div className="flex gap-3">
                    <button 
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ full_name: profile.full_name, phone: profile.phone || "" }); // Reset lại data cũ
                        }}
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-cyan-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? "⏳ Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Cột trái */}
              <div className="space-y-6">
                 <div className="group">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Họ và tên</label>
                    {isEditing ? (
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none transition-all"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            placeholder="Nhập họ tên đầy đủ"
                        />
                    ) : (
                        <p className="text-lg font-semibold text-gray-700 p-1">{profile.full_name}</p>
                    )}
                 </div>

                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Địa chỉ Email</label>
                    <div className="bg-gray-50 p-3 rounded-xl text-gray-500 border border-dashed border-gray-200 flex justify-between items-center">
                      <span>{profile.email}</span>
                      <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-md">Cố định</span>
                    </div>
                 </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Số điện thoại</label>
                    {isEditing ? (
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:bg-white outline-none transition-all"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="Ví dụ: 090xxxxxxx"
                        />
                    ) : (
                        <p className="text-lg font-semibold text-gray-700 p-1">{profile.phone || "Chưa cập nhật"}</p>
                    )}
                 </div>

                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Thông số hoạt động</label>
                    <div className="flex gap-4">
                        <div className="border px-4 py-2 rounded-2xl">
                          <span className="block text-[10px] font-bold">ĐÁNH GIÁ</span>
                          <span className=""> {profile.rating || 5.0}</span>
                        </div>
                        <div className=" border  px-4 py-2 rounded-2xl">
                          <span className="block text-[10px]  font-bold">KINH NGHIỆM</span>
                          <span className=""> {profile.experience || "1 năm"}</span>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <p className="text-center text-gray-400 text-xs mt-8 italic">
        * Lưu ý: Email là định danh duy nhất của tài khoản và không thể thay đổi. 
        Nếu cần hỗ trợ, vui lòng liên hệ Quản trị viên.
      </p>
    </div>
  );
}