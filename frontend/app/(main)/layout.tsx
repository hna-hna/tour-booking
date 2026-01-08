//frontend/app/main/layout//
/*mainlayout header,footer*/
"use client";
import React, { useState, useEffect } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [showDropdown, setShowDropdown] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("user_name");
    const email = localStorage.getItem("user_email");
    
    console.log(" Layout Loading - Checking localStorage:");
    console.log("- Token:", token ? " Có" : "❌ Không");
    console.log("- Role:", role);
    console.log("- Name:", name);
    console.log("- Email:", email);
    
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role);
      
      // Lấy tên từ localStorage
      if (name && name !== "No Name" && name !== "null" && name !== "" && name !== "User") {
        console.log(" Sử dụng tên:", name);
        setUserName(name);
      } else if (email) {
        // Nếu không có tên, dùng phần trước @ của email
        const emailName = email.split("@")[0];
        console.log(" Sử dụng email name:", emailName);
        setUserName(emailName);
      } else {
        console.log(" Không tìm thấy tên hoặc email");
      }
    }
  }, []);

  // Hàm đăng xuất
  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      setIsLoggedIn(false);
      setUserRole(null);
      setUserName("User");
      alert(" Đăng xuất thành công!");
      window.location.href = "/";
    }
  };

  // Lấy URL dashboard theo role
  const getDashboardUrl = () => {
    switch(userRole) {
      case "admin":
        return "/admin/dashboard";
      case "tour_provider":
        return "/provider/dashboard";
      case "tour_guide":
        return "/guide/dashboard";
      case "customer":
      default:
        return "/customer/dashboard";
    }
  };

  // Lấy chữ cái đầu của tên để hiển thị trong avatar
  const getInitial = () => {
    return userName.charAt(0).toUpperCase();
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
              T
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Tour Booking
            </span>
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="/" 
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group"
            >
              Trang chủ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all"></span>
            </a>
            <a 
              href="/tours" 
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group"
            >
              Danh sách Tour
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all"></span>
            </a>
            <a 
              href="/about" 
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group"
            >
              Về chúng tôi
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all"></span>
            </a>
            <a 
              href="/contact" 
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group"
            >
              Liên hệ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all"></span>
            </a>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              // Hiển thị khi đã đăng nhập
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  <div className="w-9 h-9 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                    {getInitial()}
                  </div>
                  <span className="font-medium text-gray-700 max-w-[150px] truncate">
                    {userName}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 mt-1">Xin chào!</p>
                    </div>
                    
                    <a
                      href={getDashboardUrl()}
                      className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </a>

                    <a
                      href="/profile"
                      className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Hồ sơ
                    </a>

                    <a
                      href="/bookings"
                      className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Đơn đặt tour
                    </a>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Hiển thị khi chưa đăng nhập
              <>
                <a 
                  href="/login" 
                  className="text-gray-700 hover:text-emerald-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Đăng nhập
                </a>
                <a 
                  href="/register" 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Đăng ký ngay
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl">
                  T
                </div>
                <span className="text-xl font-bold">Tour Booking</span>
              </div>
              <p className="text-gray-400 text-sm">
                Khám phá thế giới cùng chúng tôi. Trải nghiệm du lịch tuyệt vời với các gói tour đa dạng và dịch vụ chuyên nghiệp.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/" className="hover:text-emerald-400 transition-colors">Trang chủ</a></li>
                <li><a href="/tours" className="hover:text-emerald-400 transition-colors">Danh sách Tour</a></li>
                <li><a href="/about" className="hover:text-emerald-400 transition-colors">Về chúng tôi</a></li>
                <li><a href="/contact" className="hover:text-emerald-400 transition-colors">Liên hệ</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Dịch vụ</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Tour trong nước</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Tour nước ngoài</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Vé máy bay</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Khách sạn</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start">
                  <span className="mr-2"></span>
                  <span>123 Đường ABC, Quận 1, TP.HCM</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2"></span>
                  <span>1900 xxxx</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2"></span>
                  <span>info@tourbooking.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
            <p>© 2025 Tour Booking System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}