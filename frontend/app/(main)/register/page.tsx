//frontend/app/(main)/register/page.tsx//

"use client";
import React, { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);

    fetch("http://127.0.0.1:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.msg === "User registered successfully") {
          alert(" Đăng ký thành công!");
          window.location.href = "/login";
        } else {
          alert(data.msg || "Đăng ký thất bại!");
        }
      })
      .catch(() => {
        alert(" Không kết nối được server Flask!(f12)");
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
            Đăng ký
          </h1>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-5">
          <div>
            <input
              type="text"
              name="full_name"
              placeholder="Họ và tên"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all text-gray-700"
            >
              <option value="customer">Khách hàng</option>
              <option value="supplier">Nhà cung cấp tour</option>
              <option value="guide">Hướng dẫn viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            }`}
          >
            {loading ? "ĐANG XỬ LÝ..." : "TẠO TÀI KHOẢN"}
          </button>

          <div className="text-center pt-2">
            <p className="text-gray-600">
              Đã có tài khoản?{" "}
              <a
                href="/login"
                className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline transition-all"
              >
                Đăng nhập ngay
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}