/* app/(dashboard)/admin/page.tsx */
import React from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const stats = [
    { 
      title: "Tổng Doanh Thu", 
      value: "150.000.000đ", 
      change: "+12%", 
      isPositive: true,
      icon: "",
      color: "from-green-500 to-emerald-600"
    },
    { 
      title: "Đơn Hàng Mới", 
      value: "24", 
      change: "+5", 
      isPositive: true,
      icon: "",
      color: "from-blue-500 to-indigo-600"
    },
    { 
      title: "Khách Hàng", 
      value: "1,203", 
      change: "+18%", 
      isPositive: true,
      icon: "",
      color: "from-blue-500 to-indigo-600"
    },
    { 
      title: "Tour Chờ Duyệt", 
      value: "5", 
      change: "-2", 
      isPositive: false, 
      icon: "",
      color: "from-blue-500 to-indigo-600"
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 1. Phần Chào mừng */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Xin chào, Admin! </h1>
        <p className="text-gray-500 mt-2">Đây là tình hình kinh doanh của hệ thống hôm nay.</p>
      </div>

      {/* 2. Các thẻ thống kê (Stats Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`rounded-2xl p-6 shadow-lg text-white bg-gradient-to-br ${stat.color} relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-6 -mt-6"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-lg text-2xl">
                  {stat.icon}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/20`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-gray-100 text-sm font-medium mt-4">{stat.title}</p>
              <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Khu vực nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột trái: Hoạt động gần đây (Chiếm 2 phần) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Đơn đặt tour gần đây</h3>
            <Link href="/admin/orders" className="text-emerald-600 text-sm font-medium hover:underline">
              Xem tất cả
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="pb-3">Khách hàng</th>
                  <th className="pb-3">Tour</th>
                  <th className="pb-3">Giá trị</th>
                  <th className="pb-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* Dữ liệu giả mẫu */}
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="font-medium text-gray-800">Nguyễn Văn A</div>
                      <div className="text-xs text-gray-400">a@example.com</div>
                    </td>
                    <td className="py-4 text-sm text-gray-600">Tour tham quan Đà Nẵng</td>
                    <td className="py-4 font-bold text-gray-800">2.500.000đ</td>
                    <td className="py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                        Đã thanh toán
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột phải: Lối tắt  */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Truy cập nhanh</h3>
          <div className="space-y-4">
            <Link href="/admin/approve-tours" className="block p-4 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-600">
                    
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Duyệt Tour</p>
                    <p className="text-xs text-gray-500">5 tour đang chờ</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>

            <Link href="/admin/users" className="block p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-600">
                    
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Quản lý Users</p>
                    <p className="text-xs text-gray-500">Thêm/Khóa tài khoản</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}