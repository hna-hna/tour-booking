// app/(main)/tours/[id]/page.tsx
"use client";
<<<<<<< HEAD

=======
>>>>>>> origin/thanh-thu
import { use, useEffect, useState } from "react";
import axios from "axios";

export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Giải mã params (Next.js 15+ yêu cầu dùng 'use' hoặc await cho params)
  const resolvedParams = use(params);
<<<<<<< HEAD
=======

  // Thêm State để lưu dữ liệu tour
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
>>>>>>> origin/thanh-thu

  // State lưu trữ dữ liệu tour và trạng thái tải
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        // Gọi API lấy chi tiết tour từ Backend Flask
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

  // Trạng thái Loading chuyên nghiệp
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      <span className="ml-3 font-medium text-gray-600">Đang tải dữ liệu tour...</span>
    </div>
  );

  // Trạng thái Error khi không tìm thấy Tour
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
<<<<<<< HEAD
          
          {/* Hình ảnh Tour */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl bg-gray-100 mb-8">
            <img 
              src={tour.image_url || "/placeholder-tour.jpg"} 
              className="w-full h-full object-cover" 
              alt={tour.name} 
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-emerald-700 shadow-sm">
              Tour Phổ Biến
            </div>
          </div>

          {/* Lịch trình & Mô tả */}
          <div className="space-y-8">
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-lg">📍</span>
                Mô tả chi tiết
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">
                {tour.description || "Chưa có mô tả cụ thể cho tour này."}
              </p>
            </section>

            {tour.itinerary && (
              <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Lịch trình dự kiến</h3>
                <div className="prose prose-emerald max-w-none text-gray-600 whitespace-pre-line">
                  {tour.itinerary}
                </div>
              </section>
            )}
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
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span> Xác nhận tức thì</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span> Bảo hiểm du lịch trọn gói</span>
              </div>
            </div>

            <a 
              href={`/checkout?id=${tour.id}`}
              className="group relative flex w-full justify-center items-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
=======

          {/* Ảnh: Kiểm tra nếu có image_url thì hiển thị, không thì để placeholder */}
          <div className="bg-gray-200 h-96 rounded-xl mb-6 overflow-hidden flex items-center justify-center">
  {tour.image ? (
    <img 
      src={tour.image} 
      key={tour.image} // Thêm key để React ép render lại khi link thay đổi
      className="w-full h-full object-cover" 
      alt={tour.name}
      referrerPolicy="no-referrer" // Thêm dòng này nếu Supabase chặn referrer từ localhost
      onError={(e) => {
        console.log("Link ảnh bị lỗi:", tour.image); // In ra console để xem link thực tế là gì
        (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x400?text=Loi_Link_Anh";
      }} 
    />
  ) : (
    <p className="text-gray-400">Không có dữ liệu ảnh</p>
  )}
</div>

          <div className="prose max-w-none">
            <h3 className="text-2xl font-bold mb-2">Lịch trình</h3>
            {/* Thay mô tả thật */}
            <p className="whitespace-pre-line">{tour.itinerary || tour.description || "Đang cập nhật nội dung..."}</p>
          </div>
        </div>

        {/* Cột phải: Form đặt tour */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
            <p className="text-gray-500 mb-1 font-medium">Giá mỗi khách</p>
            {/* Thay giá thật từ database */}
            <p className="text-3xl font-bold text-emerald-600 mb-6">
              {tour.price?.toLocaleString()}đ
            </p>

            <a
              href={`/checkout?id=${tour.id}`} // Truyền ID sang trang checkout
              className="block w-full text-center bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
>>>>>>> origin/thanh-thu
            >
              ĐẶT TOUR NGAY
              <span className="group-hover:translate-x-1 transition-transform">→</span>
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