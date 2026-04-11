"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Menu, X, LayoutDashboard, Users, Map, 
  ShoppingCart, BarChart3, LogOut, ClipboardList, ShieldCheck 
} from "lucide-react";
import axios from "axios";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{full_name: string} | null>(null);

useEffect(() => {
  const checkAdminAuth = async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role?.trim().toUpperCase() !== "ADMIN") {
      handleForcedLogout();
      return;
    }

    try {
      const res = await axios.get("http://localhost:5000/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.role?.trim().toUpperCase() !== "ADMIN") {
        throw new Error("Invalid role");
      }

      setAdminInfo({ full_name: res.data.full_name });
      setIsAuthorized(true);

    } catch (error: any) {
      console.error("Auth Error:", error);
      alert("Xác thực thất bại. Vui lòng đăng nhập lại.");
      handleForcedLogout();
    } finally {
      setLoading(false);
    }
  };

  checkAdminAuth();
}, []);

  const handleForcedLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Admin?")) {
      handleForcedLogout();
    }
  };

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

  // Màn hình chờ khi đang check quyền
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <ShieldCheck size={48} className="text-emerald-500 animate-pulse mb-4" />
        <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">Security Checking...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className={`bg-slate-900 text-slate-100 transition-all duration-300 flex flex-col fixed h-full z-30 shadow-2xl ${isSidebarOpen ? "w-72" : "w-20"}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            {isSidebarOpen && <span className="text-lg font-bold tracking-tighter uppercase">Admin Panel</span>}
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-medium">
            <LogOut size={20} />
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-20"}`}>
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-slate-800 text-sm leading-none uppercase">{adminInfo?.full_name || "Admin"}</p>
              <p className="text-[10px] text-red-500 font-black mt-1 tracking-tighter uppercase">System Root</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-emerald-500 font-bold border-2 border-emerald-500/20 shadow-lg">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 bg-slate-50">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}