"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, Package, Users, CheckCircle, 
  DollarSign, LogOut, Menu, X, Briefcase 
} from "lucide-react";
import axios from "axios";

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [supplierName, setSupplierName] = useState("");

  useEffect(() => {
    const checkSupplierAuth = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      // 1. Kiểm tra nhanh tại Client-side
      if (!token || role !== "supplier") {
        if (token) alert("Bạn không có quyền truy cập vào khu vực Nhà cung cấp!");
        handleForcedLogout();
        return;
      }

      try {
        // 2. Gọi API xác thực sâu
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Kiểm tra role trả về từ server để tránh giả mạo localStorage
        if (res.data.role !== "supplier") {
          throw new Error("Invalid role");
        }

        setSupplierName(res.data.full_name);
        setIsAuthorized(true);
      } catch (error) {
        console.error("Xác thực Supplier thất bại:", error);
        handleForcedLogout();
      } finally {
        setLoading(false);
      }
    };

    checkSupplierAuth();
  }, [router]);

  const handleForcedLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      handleForcedLogout();
    }
  };

  const menuItems = [
    { name: "Hồ sơ cá nhân", href: "/supplier/profile", icon: <User size={20} /> },
    { name: "Quản lý Tour", href: "/supplier/upload-manage-tour", icon: <Package size={20} /> },
    { name: "Quản lý HDV", href: "/supplier/tour_guide_management", icon: <Users size={20} /> },
    { name: "Duyệt HDV", href: "/supplier/approve-guide", icon: <CheckCircle size={20} /> },
    { name: "Doanh thu", href: "/supplier/revenue", icon: <DollarSign size={20} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Đang xác thực tài khoản đối tác...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-30 shadow-2xl ${isSidebarOpen ? "w-72" : "w-20"}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/40">S</div>
            {isSidebarOpen && <span className="font-bold text-lg tracking-tight uppercase">Supplier Panel</span>}
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
                  isActive ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {isSidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-medium">
            <LogOut size={20} />
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-20"}`}>
        <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-800 leading-none">{supplierName || "Nhà cung cấp"}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Đối tác chính thức</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">
              {supplierName?.charAt(0) || "S"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}