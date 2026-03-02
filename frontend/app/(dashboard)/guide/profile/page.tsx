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

  // Hàm lấy token dùng chung
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchProfile = () => {
    // Đổi sang 127.0.0.1 và thêm headers
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
        if (err.response?.status === 401) alert("Phiên đăng nhập hết hạn!");
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
      // Đổi sang 127.0.0.1 và thêm headers cho lệnh PUT
      await axios.put("http://127.0.0.1:5000/api/guide/profile", formData, {
        headers: getAuthHeader()
      });
      
      setProfile({ ...profile, ...formData , languages: formData.languages.join(", ") }); 
      setIsEditing(false);
      alert("Cập nhật thông tin thành công! ");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Không thể lưu thay đổi. Vui lòng thử lại.");
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
        {/* Banner giữ nguyên */}
        <div className="h-32 bg-gradient-to-r from-cyan-600 to-blue-600" />

        <div className="px-8 pb-8 pt-4">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">{profile.full_name}</h2>
              <p className="text-cyan-600 font-medium">Hướng dẫn viên du lịch</p>
            </div>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`${isEditing ? 'bg-green-600' : 'bg-cyan-600'} text-white px-6 py-2 rounded-xl font-bold transition-all`}
            >
              {isSaving ? "Đang lưu..." : isEditing ? "Lưu lại" : "Chỉnh sửa"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {/* Họ tên & Phone tương tự như cũ */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Họ và tên</label>
                {isEditing ? (
                  <input className="w-full border p-2 rounded-lg" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                ) : <p className="font-semibold text-gray-700">{profile.full_name}</p>}
              </div>

              {/* PHẦN NGÔN NGỮ */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Ngôn ngữ thông thạo</label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          formData.languages.includes(lang) ? "bg-cyan-600 text-white border-cyan-600" : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.languages ? profile.languages.split(", ").map((l: string) => (
                      <span key={l} className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold">{l}</span>
                    )) : "Chưa cập nhật"}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* THÔNG SỐ HOẠT ĐỘNG */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Thông số</label>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400">TRẠNG THÁI</span>
                    {isEditing ? (
                      <select 
                        className="w-full bg-transparent font-bold text-sm outline-none text-cyan-700 cursor-pointer"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                       {STATUS_OPTIONS.map(opt => (
                         <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (      
                      <span className={`font-black text-sm ${
                         STATUS_OPTIONS.find(o => o.value === profile.status)?.color || "text-gray-700"
                      }`}>
                         {STATUS_OPTIONS.find(o => o.value === profile.status)?.label || profile.status}
                      </span>
                )}            
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <span className="block text-[10px] font-bold text-gray-400">KINH NGHIỆM</span>
                    {isEditing ? (
                       <input 
                         type="number" 
                         className="w-full bg-transparent font-bold text-sm outline-none" 
                         value={formData.years_of_experience} 
                         onChange={e => setFormData({...formData, years_of_experience: parseInt(e.target.value)})} 
                       />
                    ) : (
                      <span className="text-gray-700 font-black text-sm">{profile.years_of_experience} Năm</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}