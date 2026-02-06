"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  avatar: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Lấy dữ liệu
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    axios.get("http://127.0.0.1:5000/api/profile/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setProfile(res.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      }
      setLoading(false);
    });
  }, [router]);

  // Lưu dữ liệu
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      await axios.put("http://127.0.0.1:5000/api/profile/me", profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      localStorage.setItem("user_name", profile.full_name);
      setMessage({ text: "Cập nhật hồ sơ thành công!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.msg || "Có lỗi xảy ra, vui lòng thử lại.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!profile) return <div className="text-center p-10 text-gray-500">Không tải được dữ liệu.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 hover:shadow-2xl">
        
        {/* === SIDEBAR TRÁI: Gradient & Avatar === */}
        <div className="md:w-1/3 bg-gradient-to-br from-emerald-600 to-teal-800 p-10 flex flex-col items-center justify-center text-white relative overflow-hidden">
          {/* Họa tiết trang trí mờ */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-36 h-36 rounded-full p-1 bg-white/20 backdrop-blur-sm shadow-2xl mb-6 ring-4 ring-white/10">
              <img 
                src={profile.avatar && profile.avatar.length > 0 
                  ? profile.avatar 
                  : `https://ui-avatars.com/api/?name=${profile.full_name}&background=random&size=256&bold=true`} 
                alt="Avatar" 
                className="w-full h-full rounded-full object-cover shadow-inner bg-white"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/150" }}
              />
            </div>
            
            <h2 className="text-2xl font-bold tracking-wide">{profile.full_name}</h2>
            <p className="text-emerald-100 mt-1 font-light text-sm">{profile.email}</p>
            
            <div className="mt-6 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold uppercase tracking-widest shadow-sm">
              {profile.role}
            </div>
          </div>
        </div>

        {/* === FORM PHẢI: Nội dung chính === */}
        <div className="md:w-2/3 p-10 md:p-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h3>
            <span className="text-sm text-gray-400 italic">Cập nhật lần cuối: Vừa xong</span>
          </div>
          
          {/* Thông báo (Alert) - Dùng màu Rose nhẹ thay vì Red gắt */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm border ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-rose-50 text-rose-700 border-rose-100' 
            }`}>
              <span className="text-2xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Input: Họ tên */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Họ và tên</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800 font-medium placeholder-gray-400"
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                />
              </div>
            </div>

            {/* Grid: Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed select-none font-medium"
                    value={profile.email}
                    disabled
                  />
                  <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-semibold bg-gray-200 px-2 py-0.5 rounded">LOCKED</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Số điện thoại</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800"
                  placeholder="Thêm số điện thoại..."
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                />
              </div>
            </div>

            {/* Input: Địa chỉ */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Địa chỉ</label>
              <textarea 
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-gray-800 resize-none"
                placeholder="Nhập địa chỉ của bạn..."
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
              />
            </div>

            {/* Nút Submit - Gradient đẹp */}
            <div className="pt-6 border-t border-gray-100 mt-8">
              <button 
                type="submit" 
                disabled={saving}
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 hover:translate-y-[-1px] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}