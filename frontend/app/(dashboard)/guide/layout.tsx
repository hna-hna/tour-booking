"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: "Lịch Tour", href: "/guide"},
    { name: "Yêu cầu Tour", href: "/guide/requests"},
    { name: "Lịch sử Tour", href: "/guide/history" }, 
    { name: "Tin nhắn", href: "/guide/chat"},
    { name: "Hồ sơ cá nhân", href: "/guide/profile" },
  ];

  const handleLogout = () => {
    const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (confirmLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      router.push("/login"); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-cyan-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20 ${isSidebarOpen ? "w-64" : "w-20"}`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-cyan-800">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-cyan-900/50">G</div>
            {isSidebarOpen && <span className="tracking-tight">Guide Portal</span>}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-950/20" 
                    : "text-cyan-100 hover:bg-cyan-800/50 hover:text-white"
                }`}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? "scale-110" : ""}`}>
                  {item.icon}
                </span>
                {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-cyan-800 bg-cyan-900/50">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-4 px-4 py-3 w-full rounded-xl transition-all hover:bg-red-500 hover:text-white text-cyan-200 group`}
          >
            <span className="text-xl group-hover:rotate-12 transition-transform"></span>
            {isSidebarOpen && <span className="font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            {isSidebarOpen ? "" : ""}
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-800">Mr. Guide</p>
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Trực tuyến
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-inner cursor-pointer hover:rotate-3 transition-transform">
              G
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}