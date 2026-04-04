"use client";

import { use, useEffect, useState } from "react";
import axios from "axios";

// Định nghĩa interface để quản lý dữ liệu tốt hơn
interface ItineraryItem {
  day: number;
  title: string;
  description: string;
}

interface Tour {
  id: number;
  name: string;
  price: number;
  description: string;
  itinerary: ItineraryItem[] | string; // Có thể là mảng Object hoặc String dự phòng
  image: string;
  image_url?: string;
  quantity?: number;
  start_date?: string;
  end_date?: string;
}

export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://127.0.0.1:5000/api/tours/${resolvedParams.id}`);
        setTour(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu tour:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.id) {
      fetchTour();
    }
  }, [resolvedParams.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      <span className="ml-3 font-medium text-gray-600">Đang tải dữ liệu tour...</span>
    </div>
  );

  if (error || !tour) return (
    <div className="p-20 text-center">
      <h2 className="text-2xl font-bold text-red-500">Tour không tồn tại hoặc đã bị gỡ bỏ!</h2>
      <a href="/tours" className="text-emerald-600 underline mt-4 inline-block">Quay lại danh sách tour</a>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Cột trái: Thông tin chi tiết */}
        <div className="lg:col-span-2">
          <nav className="text-sm text-gray-500 mb-4">
            Trang chủ / Tours / <span className="text-gray-900">{tour.name}</span>
          </nav>
          
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
            {tour.name}
          </h1>
          
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl bg-gray-100 mb-8">
            <img 
              src={tour.image || tour.image_url || "https://via.placeholder.com/800x400?text=No+Image"} 
              className="w-full h-full object-cover" 
              alt={tour.name} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x400?text=Loi_Link_Anh";
              }}
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-emerald-700 shadow-sm">
              Tour Phổ Biến
            </div>
          </div>

          <div className="space-y-10">
            {/* Phần Mô tả */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                Mô tả chi tiết
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
                {tour.description || "Chưa có mô tả cụ thể cho tour này."}
              </p>
            </section>

            {/* Phần Lịch trình - ĐÃ FIX LỖI OBJECT Ở ĐÂY */}
            <section className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Lịch trình dự kiến</h3>
              
              {tour.itinerary && Array.isArray(tour.itinerary) ? (
                <div className="space-y-6">
                  {tour.itinerary.map((item, index) => (
                    <div key={index} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                          {item.day}
                        </div>
                        {index !== (tour.itinerary as ItineraryItem[]).length - 1 && (
                          <div className="w-0.5 h-full bg-emerald-200 my-1"></div>
                        )}
                      </div>
                      <div className="pb-6">
                        <h4 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 mt-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {typeof tour.itinerary === 'string' ? tour.itinerary : "Chưa có thông tin lịch trình chi tiết."}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Cột phải: Form đặt tour (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 ring-1 ring-gray-900/5">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Giá từ</p>
                <p className="text-4xl font-black text-emerald-600">
                  {tour.price?.toLocaleString()}đ
                </p>
              </div>
              <span className="text-gray-400 text-sm">/ khách</span>
            </div>
            
            <div className="space-y-4 mb-8 border-t border-b border-gray-50 py-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                ⚡ Chỉ còn nhận tối đa: {tour.quantity || 0} chỗ
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 px-2 font-medium">
                ✅ Xác nhận tức thì
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 px-2 font-medium">
                🛡️ Bảo hiểm du lịch trọn gói
              </div>
            </div>

            <a 
              href={`/checkout?id=${tour.id}`}
              className="flex w-full justify-center items-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
              ĐẶT TOUR NGAY
            </a>
            
            <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
              Bằng cách nhấn Đặt ngay, bạn đồng ý với <br/>
              <span className="underline cursor-pointer">Điều khoản & Chính sách</span> của chúng tôi.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}