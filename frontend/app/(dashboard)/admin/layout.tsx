"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react"; // Chỉ giữ lại Menu/X cho chức năng đóng mở

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuItems = [
    { name: "Tổng quan", href: "/admin" },
    { name: "Quản lý Users", href: "/admin/users" },
    { name: "Duyệt Tour", href: "/admin/approve-tours" },
    { name: "Đơn hàng", href: "/admin/orders" },
    { name: "Thống kê", href: "/admin/reports" },
  ];

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.clear();
      router.push("/login");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100 transition-all duration-300 flex flex-col fixed h-full z-30 shadow-xl ${isSidebarOpen ? "w-72" : "w-0 overflow-hidden"}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="text-lg font-semibold tracking-tight">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center px-5 py-3.5 rounded-xl transition-all font-medium text-sm ${
                  isActive ? "bg-emerald-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-700/40 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-700/50">
          <button onClick={handleLogout} className="w-full px-5 py-3.5 rounded-xl text-slate-300 hover:bg-red-600/80 hover:text-white transition-all font-medium text-sm text-left">
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-0"}`}>
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-slate-800 text-sm leading-none">ADMIN</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Trực tuyến</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">AD</div>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}