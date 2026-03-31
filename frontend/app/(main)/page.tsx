"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

// Định nghĩa interface để quản lý dữ liệu chặt chẽ hơn
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

  // Hàm tải dữ liệu được tách riêng để có thể tái sử dụng (như nút "Thử tải lại")
  const fetchTours = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    // Nếu có token thì gọi API AI gợi ý, ngược lại gọi API tour phổ biến
    const endpoint = token 
      ? "http://localhost:5000/api/customer/tours/recommend" 
      : "http://localhost:5000/api/customer/tours/popular";

    if (token) setUserType("user");

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(endpoint, { headers });
      
      console.log("Dữ liệu nhận về từ API:", res.data);
      setRecommendedTours(res.data);
    } catch (error) {
      console.error("Lỗi tải tour:", error);
      
      // LOGIC DỰ PHÒNG (Fallback): Nếu lỗi khi tải tour gợi ý, quay về tải tour phổ biến
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
      {/* Hero Section - Làm mới giao diện rực rỡ hơn */}
      <div className="text-center py-20 bg-emerald-50 rounded-[3rem] mb-12 shadow-inner border border-emerald-100">
        <h1 className="text-5xl md:text-6xl font-black text-emerald-800 mb-6 tracking-tight">
          Khám phá vẻ đẹp <br className="hidden md:block"/> Việt Nam
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
          Hơn 1000+ tour du lịch hấp dẫn với trải nghiệm bản địa độc đáo đang chờ đón bạn.
        </p>
        <Link 
          href="/tours" 
          className="bg-emerald-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-emerald-700 transition-all hover:shadow-xl active:scale-95 inline-block"
        >
          Tìm Tour Ngay
        </Link>
      </div>
      
      {/* Tours Grid Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              {userType === "user" ? "Gợi ý sản phẩm nổi bật" : "Tour được yêu thích nhất 🔥"}
            </h2>
            <p className="text-gray-500 mt-2">
              {userType === "user" 
                ? "Dựa trên sở thích về lịch sử và tìm kiếm." 
                : "Những tour được đặt nhiều nhất tuần qua."}
            </p>
          </div>
          <Link href="/tours" className="text-emerald-600 font-bold hover:underline">
            Xem tất cả →
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-emerald-600 font-medium animate-pulse">Đang phân tích dữ liệu AI...</p>
          </div>
        ) : recommendedTours.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedTours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col">
                
                {/* Image Section */}
                <div className="h-60 bg-gray-100 relative overflow-hidden">
                  {tour.image ? (
                    <img 
                      src={tour.image.startsWith('http') ? tour.image : `http://localhost:5000/static/uploads/${tour.image}`} 
                      alt={tour.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full shadow-md">
                     <span className="text-emerald-700 font-black text-base">
                        {tour.price.toLocaleString()} đ
                     </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-xl mb-3 text-gray-800 line-clamp-2 group-hover:text-emerald-600 transition h-14">
                    {tour.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-6">
                    <span className="mr-2"></span>
                    Khởi hành: {tour.start_date ? new Date(tour.start_date).toLocaleDateString('vi-VN') : 'Liên hệ'}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <Link 
                      href={`/tours/${tour.id}`} 
                      className="block w-full text-center bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-sm"
                    >
                      Xem chi tiết tour
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-4 font-medium">Hiện tại chưa có tour nào phù hợp.</p>
            <button onClick={fetchTours} className="text-emerald-600 underline font-black uppercase tracking-wider">
              Thử tải lại dữ liệu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}