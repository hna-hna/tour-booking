/* app/(dashboard)/admin/layout.tsx */
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Danh sách menu của Admin
  const menuItems = [
    { name: "Tổng quan", href: "/admin", icon: "📊" },
    { name: "Quản lý Users", href: "/admin/users", icon: "👥" },
    { name: "Duyệt Tour", href: "/admin/approve-tours", icon: "✅" },
    { name: "Đơn hàng", href: "/admin/orders", icon: "📦" },
    { name: "Thống kê", href: "/admin/reports", icon: "📈" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 1. SIDEBAR - Cố định bên trái */}
      <aside 
        className={`bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              A
            </div>
            {isSidebarOpen && <span className="text-emerald-400">Admin Panel</span>}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 space-y-2 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-700">
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-xs">
              AD
            </div>
            {isSidebarOpen && (
              <div className="text-left">
                <p className="text-sm font-medium">Administrator</p>
                <p className="text-xs text-slate-500">Đăng xuất</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT - Bên phải */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Header (Top Bar) */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200"></div>
          </div>
        </header>

        {/* Nội dung thay đổi của từng trang sẽ nằm ở đây */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}