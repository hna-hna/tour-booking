"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

interface Tour {
  id: number;
  name: string;
  price: number;
  image: string;
  start_date?: string;
}

export default function HomePage() {
  const [recommendedTours, setRecommendedTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<"guest" | "user">("guest");

  const fetchTours = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const endpoint = token 
      ? "http://localhost:5000/api/tours/recommend" 
      : "http://localhost:5000/api/tours/popular";

    if (token) setUserType("user");

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(endpoint, { headers });
      
      // Log để debug xem dữ liệu có thực sự về không
      console.log("Dữ liệu nhận về từ API:", res.data);
      setRecommendedTours(res.data);
    } catch (error) {
      console.error("Lỗi tải tour:", error);
      // Nếu lỗi API recommend (token hết hạn...), thử tải tour phổ biến làm fallback
      try {
        const fallbackRes = await axios.get("http://localhost:5000/api/tours/popular");
        setRecommendedTours(fallbackRes.data);
        setUserType("guest");
      } catch (fallbackErr) {
        console.error("Lỗi tải fallback:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center py-20 bg-emerald-50 rounded-3xl mb-12 shadow-inner">
        <h1 className="text-5xl font-bold text-emerald-800 mb-6">
          Khám phá vẻ đẹp Việt Nam
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Hơn 1000+ tour du lịch hấp dẫn đang chờ đón bạn
        </p>
        <Link 
          href="/tours" 
          className="bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-700 transition-all hover:shadow-lg"
        >
          Tìm Tour Ngay
        </Link>
      </div>
      
      {/* Tours Grid Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-2 text-gray-800 flex items-center gap-2">
          {userType === "user" ? "Gợi ý dành riêng cho bạn " : "Tour được yêu thích nhất 🔥"}
        </h2>
        <p className="text-gray-500 mb-8">
          {userType === "user" 
            ? "Dựa trên sở thích và lịch sử tìm kiếm của bạn." 
            : "Những tour được đặt nhiều nhất tuần qua."}
        </p>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-emerald-600 font-medium">Đang phân tích dữ liệu AI...</p>
          </div>
        ) : recommendedTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedTours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                
                {/* Image Section - Đã tối ưu theo mục 5 */}
                <div className="h-56 bg-gray-100 relative overflow-hidden">
                  {tour.image ? (
                    <img 
                      src={tour.image.startsWith('http') ? tour.image : `http://localhost:5000/static/uploads/${tour.image}`} 
                      alt={tour.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/400x300?text=Hinh+Anh+Tour";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50 italic">
                      Chưa có hình ảnh
                    </div>
                  )}
                  {/* Badge giá đè lên ảnh */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg shadow-sm">
                     <span className="text-emerald-700 font-bold text-sm">
                        {tour.price.toLocaleString()} đ
                     </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-3 text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition">
                    {tour.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-6">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Khởi hành: {tour.start_date ? new Date(tour.start_date).toLocaleDateString('vi-VN') : 'Liên hệ'}
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <Link 
                      href={`/tours/${tour.id}`} 
                      className="w-full text-center bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      Xem chi tiết tour
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-4 font-medium">Hiện tại chưa có tour nào được duyệt để hiển thị.</p>
            <button onClick={fetchTours} className="text-emerald-600 underline font-bold">Thử tải lại</button>
          </div>
        )}
      </div>
    </div>
  );
}