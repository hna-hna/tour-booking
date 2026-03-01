"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function HomePage() {
  const [recommendedTours, setRecommendedTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<"guest" | "user">("guest");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const endpoint = token 
      ? "http://localhost:5000/api/tours/recommend" // API AI gợi ý
      : "http://localhost:5000/api/tours/popular"; // API Tour phổ biến (chưa login)

    if (token) setUserType("user");

    const fetchTours = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(endpoint, { headers });
        setRecommendedTours(res.data);
      } catch (error) {
        console.error("Lỗi tải tour gợi ý:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center py-20 bg-emerald-50 rounded-3xl mb-12">
        <h1 className="text-5xl font-bold text-emerald-800 mb-6">
          Khám phá vẻ đẹp Việt Nam
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Hơn 1000+ tour du lịch hấp dẫn đang chờ đón bạn
        </p>
        <Link 
          href="/tours" 
          className="bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-700 transition"
        >
          Tìm Tour Ngay
        </Link>
      </div>
      
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-2 text-gray-800">
          {userType === "user" ? "Gợi ý dành riêng cho bạn ✨" : "Tour được yêu thích nhất 🔥"}
        </h2>
        <p className="text-gray-500 mb-6">
          {userType === "user" 
            ? "Dựa trên sở thích và lịch sử tìm kiếm của bạn." 
            : "Những tour được đặt nhiều nhất tuần qua."}
        </p>

        {loading ? (
          <div className="text-center py-10">Đang phân tích dữ liệu...</div>
        ) : recommendedTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recommendedTours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group">
                <div className="h-48 bg-gray-200 relative">
                   {/* Giả lập ảnh */}
                   <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      {tour.image ? (
                        <img src={`http://localhost:5000/static/uploads/${tour.image}`} alt={tour.name} className="w-full h-full object-cover" />
                      ) : "No Image"}
                   </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-emerald-600 transition">
                    {tour.name}
                  </h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-red-600 font-bold text-lg">
                      {tour.price.toLocaleString()} đ
                    </span>
                    <Link href={`/tours/${tour.id}`} className="text-sm font-semibold text-emerald-600 border border-emerald-600 px-3 py-1 rounded hover:bg-emerald-50">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Chưa có dữ liệu để gợi ý.</p>
        )}
      </div>
    </div>
  );
}