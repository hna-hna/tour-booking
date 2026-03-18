"use client";
import React, { useEffect, useState } from 'react';

interface User {
  id: number; full_name: string; email: string; 
  role: string; is_active: boolean; created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/admin/users');
        if (res.ok) setUsers(await res.json());
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`Xác nhận ${currentStatus ? "KHÓA" : "MỞ"} tài khoản này?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${id}/toggle-status`, { method: 'PUT' });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse">Đang truy xuất danh sách...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Quản lý Tài khoản</h1>
        <p className="text-slate-500">Phân quyền và kiểm soát trạng thái người dùng</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase">Thông tin</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase">Vai trò</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase text-center">Trạng thái</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-emerald-50/20 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-inner">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{user.full_name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        user.is_active ? 'bg-white border border-slate-200 text-red-500 hover:bg-red-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'
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