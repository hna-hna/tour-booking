"use client";
import React, { useEffect, useState } from 'react';

interface User {
  id: number; full_name: string; email: string;
  role: string; is_active: boolean; is_deleted: boolean; created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ full_name: "", email: "", role: "customer" });

  const fetchUsers = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users?status=${statusFilter}`);
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editUser 
      ? `http://127.0.0.1:5000/api/admin/users/${editUser.id}` 
      : `http://127.0.0.1:5000/api/admin/users`;
    
    try {
      const res = await fetch(url, {
        method: editUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        alert(editUser ? "Cập nhật thành công!" : "Thêm mới thành công! Mật khẩu mặc định: 123456");
      } else {
        try {
          const error = await res.json();
          alert(`Lỗi: ${error.msg || error.error || 'Dữ liệu không hợp lệ.'}`);
        } catch(err) {
          alert('Có lỗi hệ thống khi lưu thông tin!');
        }
      }
    } catch (e) { console.error(e); alert('Không thể kết nối đến server!'); }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn XÓA (Soft delete) tài khoản này? Người dùng sẽ không thể đăng nhập.")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
        alert("Xóa thành công!");
      } else {
        try {
           const error = await res.json();
           alert(`Xóa thất bại: ${error.error || error.msg}`);
        } catch(err) {
           alert("Xóa thất bại do lỗi hệ thống!");
        }
      }
    } catch (e) { console.error(e); alert('Không thể kết nối đến server!'); }
  };

  const openAddModal = () => {
    setEditUser(null);
    setFormData({ full_name: "", email: "", role: "customer" });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditUser(user);
    setFormData({ full_name: user.full_name, email: user.email, role: user.role });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!confirm(`Xác nhận ${currentStatus ? "KHÓA" : "MỞ"} tài khoản này?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users/${id}/toggle-status`, { method: 'PUT' });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      } else {
        alert("Thao tác thất bại do lỗi hệ thống!");
      }
    } catch (e) { console.error(e); alert('Không thể kết nối đến server!'); }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse">Đang truy xuất danh sách...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Quản lý Tài khoản</h1>
          <p className="text-slate-500">Phân quyền và kiểm soát trạng thái người dùng</p>
        </div>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-40 px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs shadow-sm bg-white font-bold"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="customer">Khách hàng</option>
            <option value="supplier">Nhà cung cấp</option>
            <option value="guide">Hướng dẫn viên</option>
            <option value="admin">Quản trị viên</option>
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs shadow-sm bg-white font-bold text-emerald-600 border-emerald-100"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="active">Chỉ: Đang hoạt động</option>
            <option value="locked">Chỉ: Đã khóa</option>
            <option value="deleted">Chỉ: Đã xóa (Ẩn)</option>
          </select>

          <input
            type="text"
            placeholder="🔍 Tìm kiếm tên/email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-48 px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs shadow-sm"
          />
          <button 
            onClick={openAddModal}
            className="px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition flex-shrink-0"
          >
            + Thêm
          </button>
        </div>
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 italic">Không tìm thấy người dùng nào</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
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
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      {user.is_deleted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                           Đã xóa (Mềm)
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right space-x-2 whitespace-nowrap">
                      {!user.is_deleted && (
                        <>
                          <button
                            onClick={() => openEditModal(user)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`px-3 py-1.5 rounded-lg font-bold transition ${user.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          >
                            {user.is_active ? 'Khóa' : 'Mở'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition"
                          >
                            Xóa
                          </button>
                        </>
                      )}
                      {user.is_deleted && (
                        <span className="text-xs text-slate-400 italic">Không thể thao tác</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">{editUser ? "Sửa tài khoản" : "Thêm tài khoản mới"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Họ và tên</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Vai trò (Role)</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none">
                  <option value="customer">Khách hàng (Customer)</option>
                  <option value="guide">Hướng dẫn viên (Guide)</option>
                  <option value="supplier">Nhà cung cấp (Supplier)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
              
              {!editUser && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-xs text-emerald-700 font-bold">Lưu ý: Mật khẩu mặc định sẽ là <span className="text-emerald-900">123456</span></p>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition">Hủy</button>
                <button type="submit" className="flex-1 py-3 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}