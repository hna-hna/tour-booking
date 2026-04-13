"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, ShieldAlert } from "lucide-react";
import axios from "axios";

interface UserInfo {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      // Kiểm tra Token có tồn tại không
      if (!token) {
        router.push("/login");
        return;
      }

      // Kiểm tra Role có phải là 'guide' không
      if (role !== "guide") {
        alert("CẢNH BÁO: Bạn không có quyền truy cập vào khu vực dành cho Hướng dẫn viên!");
        handleForcedLogout();
        return;
      }

      try {
        // Gọi API lấy profile để xác thực token còn hạn hay không
        const res = await axios.get("http://127.0.0.1:5000/api/guide/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser({
          id: res.data.id,
          full_name: res.data.full_name,
          email: res.data.email,
          role: "guide",
        });
        setIsAuthorized(true); 
      } catch (error: any) {
        console.error("Xác thực thất bại:", error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          alert("Phiên đăng nhập đã hết hạn hoặc không hợp lệ!");
          handleForcedLogout();
        } else {
          setIsAuthorized(true);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Hàm xử lý đăng xuất cưỡng bức khi vi phạm quyền
  const handleForcedLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_info");
    router.push("/login");
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      handleForcedLogout();
    }
  };

  const menuItems = [
    { name: "Lịch Tour Hiện Tại", href: "/guide" },
    { name: "Yêu Cầu Mới", href: "/guide/requests" },
    { name: "Lịch Sử Tour", href: "/guide/history" },
    { name: "Tin Nhắn", href: "/guide/chat" },
    { name: "Hồ Sơ & Cài Đặt", href: "/guide/profile"},
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium italic">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

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

      {/* Main Content */}
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
              <p className="font-semibold text-slate-800">
                {user?.full_name || "Hướng Dẫn Viên"}
              </p>
              <p className="text-xs text-emerald-600 flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Trực tuyến
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold shadow">
              {user?.full_name?.charAt(0) || "G"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}