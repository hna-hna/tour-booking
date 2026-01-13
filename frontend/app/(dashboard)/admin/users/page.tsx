"use client";
import React, { useEffect, useState } from 'react';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/admin/users');
        if (!res.ok) throw new Error('Lỗi tải dữ liệu');
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? "KHÓA" : "MỞ"} tài khoản này?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${id}/toggle-status`, { method: 'PUT' });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      }
    } catch (e) { console.error(e); }
  };

  // Tính toán thống kê nhanh
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const providers = users.filter(u => u.role === 'supplier').length;

  if (loading) return <div className="p-10 text-center text-emerald-600 font-bold">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Tài khoản</h1>
        <p className="text-gray-500 mt-2">Theo dõi và quản lý người dùng trong hệ thống</p>
      </div>

      {/* Stats Cards - Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { title: "Tổng người dùng", value: totalUsers, icon: "👥", color: "from-emerald-400 to-teal-500" },
          { title: "Đang hoạt động", value: activeUsers, icon: "✅", color: "from-blue-400 to-indigo-500" },
          { title: "Nhà cung cấp", value: providers, icon: "uD83C\uDFE2", color: "from-orange-400 to-red-500" },
        ].map((stat, index) => (
          <div key={index} className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r ${stat.color} text-white shadow-lg transform hover:-translate-y-1 transition-all`}>
            <div className="relative z-10">
              <p className="text-sm font-medium opacity-80">{stat.title}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className="absolute right-0 top-0 h-full w-24 bg-white opacity-10 transform skew-x-12"></div>
            <div className="absolute right-4 bottom-4 text-4xl opacity-20">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-100">
                <th className="p-5 text-sm font-semibold text-emerald-700 uppercase tracking-wider">User Info</th>
                <th className="p-5 text-sm font-semibold text-emerald-700 uppercase tracking-wider">Vai trò</th>
                <th className="p-5 text-sm font-semibold text-emerald-700 uppercase tracking-wider">Ngày tạo</th>
                <th className="p-5 text-sm font-semibold text-emerald-700 uppercase tracking-wider text-center">Trạng thái</th>
                <th className="p-5 text-sm font-semibold text-emerald-700 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      user.role === 'supplier' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-5 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="p-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {user.is_active ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                        user.is_active 
                        ? 'bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
                      }`}
                    >
                      {user.is_active ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}