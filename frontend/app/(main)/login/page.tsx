"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Sử dụng router của Next.js

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.access_token && data.user_info) {
        // 1. Lưu thông tin vào LocalStorage
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user_id", data.user_id || data.user_info.id); 
        localStorage.setItem("role", data.user_info.role);
        
        alert("Đăng nhập thành công!");
        
        // 2. Điều hướng dựa trên Role bằng Router (mượt mà hơn window.location)
        const role = data.user_info.role;
        switch(role) {
          case "admin":
            router.push("/admin"); 
            break;
          case "supplier": 
            router.push("/supplier/revenue");
            break;
          case "guide":   
            router.push("/guide");
            break;
          case "customer":
          default:
            router.push("/");
            break;
        }
      } else {
        alert(data.msg || "Đăng nhập thất bại! Vui lòng kiểm tra lại email/mật khẩu.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Không kết nối được server Flask! Hãy kiểm tra backend đã chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 py-8 px-6 text-center">
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight">
            Đăng nhập
          </h1>
          <p className="text-emerald-100 mt-2 text-sm italic">Hệ thống Tour Booking v0.1</p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-black text-lg shadow-xl shadow-emerald-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            }`}
          >
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP NGAY"}
          </button>

          <div className="text-center pt-4 border-t border-gray-100 mt-4">
            <p className="text-gray-500 text-sm">
              Chưa có tài khoản?{" "}
              <a href="/register" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline">
                Đăng ký ngay
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}