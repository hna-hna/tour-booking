"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

const SUPPORTED_LANGUAGES = ["Tiếng Việt", "Tiếng Anh", "Tiếng Trung", "Tiếng Nhật", "Tiếng Pháp"];
const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Sẵn sàng", color: "text-green-600" },
  { value: "BUSY", label: "Bận lịch", color: "text-amber-600" },
  { value: "ON_LEAVE", label: "Nghỉ phép", color: "text-red-600" },
];

export default function GuideProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    years_of_experience: 0,
    languages: [] as string[],
    status: "AVAILABLE",
  });

  // Hàm lấy token dùng chung để xác thực
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProfile = () => {
    // Sử dụng địa chỉ 127.0.0.1 đồng bộ với backend
    axios.get("http://127.0.0.1:5000/api/guide/profile", {
      headers: getAuthHeader()
    })
      .then((res) => {
        setProfile(res.data);
        setFormData({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          years_of_experience: res.data.years_of_experience || 0,
          languages: res.data.languages ? res.data.languages.split(", ") : [],
          status: res.data.status || "AVAILABLE",
        });
      })
      .catch((err) => {
        console.error("Lỗi lấy hồ sơ:", err);
        if (err.response?.status === 401) alert("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.");
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };
  
  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      alert("Vui lòng nhập họ và tên");
      return;
    }

    setIsSaving(true);
    try {
      // Gửi dữ liệu cập nhật lên Server
      await axios.put("http://127.0.0.1:5000/api/guide/profile", formData, {
        headers: getAuthHeader()
      });
      
      setProfile({ ...profile, ...formData, languages: formData.languages.join(", ") }); 
      setIsEditing(false);
      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-cyan-600"></div>
      <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Đang tải hồ sơ...</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-500">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        {/* Banner trang trí */}
        <div className="h-32 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600" />

        <div className="px-8 pb-8 pt-4">
          {/* Header Profile */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-5">
               <div className="w-24 h-24 rounded-[2rem] bg-white border-8 border-white shadow-2xl -mt-16 flex items-center justify-center text-4xl font-black text-cyan-600 uppercase">
                  {profile.full_name?.charAt(0)}
               </div>
               <div>
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">{profile.full_name}</h2>
                  <p className="text-cyan-600 font-bold text-sm italic uppercase tracking-wider">ID Guide: #{profile.id}</p>
               </div>
            </div>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`${isEditing ? 'bg-emerald-600 shadow-emerald-100' : 'bg-gray-900 shadow-gray-200'} text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg`}
              disabled={isSaving}
            >
              {isSaving ? "Đang xử lý..." : isEditing ? "Lưu thay đổi" : "Chỉnh sửa hồ sơ"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Cột trái: Thông tin cơ bản */}
            <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-dashed border-slate-200">
                 <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">Thông tin định danh</p>
                 <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Email tài khoản</label>
                      <p className="font-bold text-gray-500">{profile.email}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase">Đơn vị chủ quản (Supplier)</label>
                      <p className="font-black text-blue-700">
                         {profile.supplier_name || `Đối tác #${profile.supplier_id}`}
                      </p>
                    </div>
                 </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Họ và tên hiển thị</label>
                {isEditing ? (
                  <input className="w-full border-b-2 border-cyan-100 py-2 outline-none focus:border-cyan-600 transition-all font-bold text-lg" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                ) : <p className="font-black text-gray-700 text-xl tracking-tight">{profile.full_name}</p>}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Số điện thoại</label>
                {isEditing ? (
                  <input className="w-full border-b-2 border-cyan-100 py-2 outline-none focus:border-cyan-600 transition-all font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                ) : <p className="font-bold text-gray-700 text-lg">{profile.phone || "Chưa cập nhật"}</p>}
              </div>
            </div>

            {/* Cột phải: Kỹ năng & Trạng thái */}
            <div className="space-y-8">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <span className="block text-[10px] font-black text-gray-400 uppercase mb-3">Trạng thái</span>
                    {isEditing ? (
                      <select 
                        className="w-full font-black text-sm text-cyan-600 outline-none bg-transparent cursor-pointer"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (      
                      <span className={`font-black text-sm ${STATUS_OPTIONS.find(o => o.value === profile.status)?.color}`}>
                         {STATUS_OPTIONS.find(o => o.value === profile.status)?.label}
                      </span>
                    )}            
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <span className="block text-[10px] font-black text-gray-400 uppercase mb-3">Kinh nghiệm</span>
                    {isEditing ? (
                       <div className="flex items-center gap-2">
                          <input type="number" className="w-12 font-black text-sm outline-none text-cyan-600" value={formData.years_of_experience} onChange={e => setFormData({...formData, years_of_experience: parseInt(e.target.value)})} />
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Năm</span>
                       </div>
                    ) : (
                      <span className="text-gray-700 font-black text-sm">{profile.years_of_experience} Năm nghề</span>
                    )}
                  </div>
               </div>

               <div className="bg-cyan-50/40 p-6 rounded-[2rem] border border-cyan-100/50">
                <label className="text-[10px] font-black text-cyan-600 uppercase block mb-4 tracking-widest">Ngôn ngữ thông thạo</label>
                <div className="flex flex-wrap gap-2">
                  {isEditing ? (
                    SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-black border transition-all ${
                          formData.languages.includes(lang) ? "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-100" : "bg-white text-gray-400 border-gray-100 hover:border-cyan-200"
                        }`}
                      >
                        {lang}
                      </button>
                    ))
                  ) : (
                    profile.languages ? profile.languages.split(", ").map((l: string) => (
                      <span key={l} className="bg-white text-cyan-700 px-4 py-2 rounded-xl text-[11px] font-black shadow-sm border border-cyan-50">
                        {l}
                      </span>
                    )) : <span className="text-gray-400 italic text-xs">Chưa cập nhật ngôn ngữ</span>
                  )}
                </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}