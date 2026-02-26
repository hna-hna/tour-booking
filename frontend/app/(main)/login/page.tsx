"use client";
import React, { useState } from "react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);

    // URL đã được đồng bộ với backend Flask
    fetch("http://127.0.0.1:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token && data.user_info) {
          // Lưu thông tin vào LocalStorage
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("user_id", data.user_id); 
          localStorage.setItem("role", data.user_info.role);
          
          alert("Đăng nhập thành công!");
          
          // Logic điều hướng dựa trên Role đã đồng bộ
          const role = data.user_info.role;
          switch(role) {
            case "admin":
              window.location.href = "/admin/approve-tours"; 
              break;
            case "supplier": 
              window.location.href = "/supplier/upload-manage-tour";
              break;
            case "guide":   
              window.location.href = "/guide";
              break;
            case "customer":
            default:
              window.location.href = "/";
              break;
          }
        } else {
          alert(data.msg || "Đăng nhập thất bại!");
        }
      })
      .catch(() => {
        alert("Không kết nối được server Flask!");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 py-8 px-6">
          <h1 className="text-4xl font-bold text-white text-center">
            Đăng nhập
          </h1>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
            required
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
            required
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            }`}
          >
            {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
          </button>

          <div className="text-center pt-2">
            <p className="text-gray-600">
              Chưa có tài khoản?{" "}
              <a href="/register" className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline">
                Đăng ký ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}