//frontend/app/(dashboard)/guide/profile/pages.tsx
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

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProfile = () => {
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
      await axios.put("http://127.0.0.1:5000/api/guide/profile", formData, {
        headers: getAuthHeader()
      });
      
      setProfile({ ...profile, ...formData, languages: formData.languages.join(", ") }); 
      setIsEditing(false);
      alert("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Không thể lưu thay đổi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return <div className="p-20 text-center">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thông tin tài khoản</h1>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-cyan-600 to-blue-600" />

        <div className="px-8 pb-8 pt-4">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
               <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md -mt-12 flex items-center justify-center text-3xl font-bold text-cyan-600 uppercase">
                  {profile.full_name?.charAt(0)}
               </div>
               <div>
                  <h2 className="text-3xl font-bold text-gray-800">{profile.full_name}</h2>
                  <p className="text-cyan-600 font-medium italic">ID Hướng dẫn viên: #{profile.id}</p>
               </div>
            </div>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`${isEditing ? 'bg-green-600' : 'bg-gray-800'} text-white px-6 py-2 rounded-xl font-bold transition-all hover:scale-105 active:scale-95`}
            >
              {isSaving ? "" : isEditing ? "Lưu thay đổi" : " Chỉnh sửa hồ sơ"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                 <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Thông tin hệ thống (Cố định)</p>
                 <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500">Email đăng ký</label>
                      <input 
                        className="w-full bg-transparent font-medium text-gray-400 outline-none cursor-not-allowed" 
                        value={profile.email} 
                        readOnly 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Nhà cung cấp (Supplier)</label>
                      <p className="font-bold text-blue-800">
                         {profile.supplier_name || `Nhà cung cấp #${profile.supplier_id}`}
                      </p>
                    </div>
                 </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Họ và tên hiển thị</label>
                {isEditing ? (
                  <input className="w-full border-b-2 border-cyan-100 py-1 outline-none focus:border-cyan-600 transition-all font-semibold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                ) : <p className="font-bold text-gray-700 text-lg">{profile.full_name}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Số điện thoại liên lạc</label>
                {isEditing ? (
                  <input className="w-full border-b-2 border-cyan-100 py-1 outline-none focus:border-cyan-600 transition-all font-semibold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                ) : <p className="font-bold text-gray-700">{profile.phone || "Chưa cập nhật"}</p>}
              </div>
            </div>

            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="block text-[10px] font-black text-gray-400 uppercase mb-2">Trạng thái</span>
                    {isEditing ? (
                      <select 
                        className="w-full font-bold text-sm text-cyan-600 outline-none"
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

                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="block text-[10px] font-black text-gray-400 uppercase mb-2">Kinh nghiệm</span>
                    {isEditing ? (
                       <div className="flex items-center gap-1">
                          <input type="number" className="w-12 font-bold text-sm outline-none" value={formData.years_of_experience} onChange={e => setFormData({...formData, years_of_experience: parseInt(e.target.value)})} />
                          <span className="text-xs text-gray-500">Năm</span>
                       </div>
                    ) : (
                      <span className="text-gray-700 font-black text-sm">{profile.years_of_experience} Năm làm việc</span>
                    )}
                  </div>
               </div>

               <div className="bg-cyan-50/30 p-5 rounded-3xl border border-cyan-100">
                <label className="text-xs font-bold text-cyan-600 uppercase block mb-3">Ngôn ngữ thông thạo</label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          formData.languages.includes(lang) ? "bg-cyan-600 text-white border-cyan-600 shadow-md" : "bg-white text-gray-400 border-gray-100"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.languages ? profile.languages.split(", ").map((l: string) => (
                      <span key={l} className="bg-white text-cyan-700 px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm border border-cyan-50">
                        {l}
                      </span>
                    )) : <span className="text-gray-400 italic text-xs">Chưa chọn ngôn ngữ</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}