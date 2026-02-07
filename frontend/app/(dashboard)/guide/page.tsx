//frontend/app/(dashboard)/guide/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface MyTour {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function GuideDashboard() {
  const [tours, setTours] = useState<MyTour[]>([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/guide/tours")
      .then((res) => {
        console.log("Dữ liệu tour nhận được:", res.data); // Log ra để kiểm tra
        setTours(res.data);
      })
      .catch((err) => {
        console.error("Lỗi gọi API:", err);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Lịch Dẫn Tour Của Tôi</h1>
      
      {tours.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center shadow-sm">
          <p className="text-gray-500 mb-4">Bạn chưa có lịch dẫn tour nào.</p>
          <Link href="/guide/requests" className="text-emerald-600 font-bold hover:underline">
            Kiểm tra yêu cầu mới ngay 
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <div key={tour.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition group">
              <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex flex-col justify-end">
                <p className="text-white font-bold text-lg leading-tight line-clamp-2">{tour.name}</p>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Khởi hành</p>
                    <p className="font-medium">
                        {tour.start_date ? new Date(tour.start_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Kết thúc</p>
                    <p className="font-medium">
                        {tour.end_date ? new Date(tour.end_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                
                {/* NÚT BẤM VÀO CHI TIẾT */}
                <Link 
                  href={`/guide/tours/${tour.id}`} 
                  className="block w-full text-center bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all"
                >
                  Quản lý chi tiết 
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}