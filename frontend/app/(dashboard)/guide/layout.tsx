"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const menuItems = [
    { name: "Lịch Tour Hiện Tại", href: "/guide", icon: "" },
    { name: "Yêu Cầu Mới", href: "/guide/requests", icon: "" },
    { name: "Lịch Sử Tour", href: "/guide/history", icon: "" },
    { name: "Tin Nhắn", href: "/guide/chat", icon: "" },
    { name: "Hồ Sơ & Cài Đặt", href: "/guide/profile", icon: "" },
  ];

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      router.push("/login");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`bg-gradient-to-b from-slate-800 to-slate-900 text-slate-100 transition-all duration-300 flex flex-col fixed h-full z-30 shadow-xl ${
          isSidebarOpen ? "w-72" : "w-20"
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
              G
            </div>
            {isSidebarOpen && (
              <span className="text-lg font-semibold tracking-tight">HDV Portal</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-600/90 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-700/40 hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-3.5 w-full rounded-xl text-slate-300 hover:bg-red-600/80 hover:text-white transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-72" : "ml-20"
        }`}
      >
        <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-20 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-slate-800">HDV Nguyễn Văn A</p>
              <p className="text-xs text-emerald-600 flex items-center justify-end gap-1.5">
                <span className="w-2 h-2  animate-pulse"></span>
                Trực tuyến
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold shadow">
              guide
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}