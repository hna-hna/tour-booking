/* app/(dashboard)/admin/layout.tsx */
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, Users, Map, ShoppingCart, BarChart3, LogOut, ClipboardList } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Fix lỗi Hydration của Next.js khi dùng localStorage hoặc Window
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuItems = [
    { name: "Tổng quan", href: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Quản lý Users", href: "/admin/users", icon: <Users size={20} /> },
    { name: "Duyệt Tour", href: "/admin/approve-tours", icon: <Map size={20} /> },
    { name: "Lịch sử duyệt", href: "/admin/approve-history", icon: <ClipboardList size={20} /> },
    { name: "Đơn hàng", href: "/admin/orders", icon: <ShoppingCart size={20} /> },
    { name: "Thống kê Tổng quan", href: "/admin/role-stats", icon: <BarChart3 size={20} /> },
    { name: "TK Khách hàng", href: "/admin/role-stats/customers", icon: <Users size={18} className="ml-2" /> },
    { name: "TK Nhà cung cấp", href: "/admin/role-stats/suppliers", icon: <ShoppingCart size={18} className="ml-2" /> },
    { name: "TK Hướng dẫn viên", href: "/admin/role-stats/guides", icon: <BarChart3 size={18} className="ml-2" /> },
  ];

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Admin?")) {
      localStorage.clear();
      router.push("/login");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. SIDEBAR - Giao diện Gradient tối */}
      <aside 
        className={`bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100 transition-all duration-300 flex flex-col fixed h-full z-30 shadow-xl ${
          isSidebarOpen ? "w-72" : "w-20"
        }`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
              A
            </div>
            {isSidebarOpen && (
              <span className="text-lg font-semibold tracking-tight whitespace-nowrap">Admin Portal</span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-8 px-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                    : "text-slate-400 hover:bg-slate-700/40 hover:text-white"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-700/50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-all font-medium text-sm text-left"
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-72" : "ml-20"
        }`}
      >
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-20">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="font-bold text-slate-800 text-sm leading-none uppercase">Quản trị viên</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1 tracking-wider">Trực tuyến</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-inner">
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}