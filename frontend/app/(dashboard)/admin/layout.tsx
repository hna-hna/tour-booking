/* app/(dashboard)/admin/layout.tsx */
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Mình sử dụng các icon phổ biến từ heroicons hoặc lucide để menu sinh động hơn
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  ShoppingBag, 
  BarChart3, 
  LogOut,
  Menu,
  X 
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Danh sách menu của Admin được gộp từ cả 2 nhánh
  const menuItems = [
    { name: "Tổng quan", href: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Quản lý Users", href: "/admin/users", icon: <Users size={20} /> },
    { name: "Duyệt Tour", href: "/admin/approve-tours", icon: <CheckCircle size={20} /> },
    { name: "Đơn hàng", href: "/admin/orders", icon: <ShoppingBag size={20} /> },
    { name: "Thống kê", href: "/admin/reports", icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 1. SIDEBAR */}
      <aside 
        className={`bg-slate-900 text-white transition-all duration-500 ease-in-out flex flex-col fixed h-full z-20 shadow-2xl ${
          isSidebarOpen ? "w-72" : "w-24"
        }`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 rotate-3">
              <span className="font-black text-xl">Q</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight leading-none text-white">VAA TRAVEL</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Admin Panel</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-8 space-y-2 px-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-900/40"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                  {item.icon}
                </span>
                {isSidebarOpen && (
                  <span className={`font-bold text-sm tracking-wide ${isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}>
                    {item.name}
                  </span>
                )}
                {isActive && isSidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-glow"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-6 border-t border-slate-800">
          <button className="flex items-center gap-4 w-full p-3 rounded-2xl hover:bg-rose-500/10 hover:text-rose-400 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black text-emerald-400 group-hover:bg-rose-500/20">
              AD
            </div>
            {isSidebarOpen && (
              <div className="text-left flex-1">
                <p className="text-sm font-black tracking-tight text-white group-hover:text-rose-400">Như Quỳnh</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Đăng xuất</p>
              </div>
            )}
            {isSidebarOpen && <LogOut size={16} className="opacity-20 group-hover:opacity-100 transition-opacity" />}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT*/}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out ${
          isSidebarOpen ? "ml-72" : "ml-24"
        }`}
      >
        {/* Header (Top Bar) */}
        <header className="h-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-3 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors shadow-sm border border-gray-50"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Hệ thống hoạt động</span>
              <span className="text-xs font-bold text-emerald-600">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-50 border border-emerald-200 shadow-inner flex items-center justify-center text-emerald-600 font-black">
              NQ
            </div>
          </div>
        </header>

        {/* Nội dung chính của các trang con */}
        <main className="flex-1 p-4 md:p-8 bg-[#fcfdfe]">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}