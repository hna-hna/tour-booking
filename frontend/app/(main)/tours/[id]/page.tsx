// app/(main)/tours/[id]/page.tsx
"use client"; 
import { use, useEffect, useState } from "react";
import axios from "axios";

export default function TourDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  // Thêm State để lưu dữ liệu tour
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu thật
  useEffect(() => {
    const fetchTour = async () => {
      try {
        // Sử dụng ID từ params để gọi đúng Tour trong Database
        const res = await axios.get(`http://127.0.0.1:5000/api/tours/${resolvedParams.id}`);
        setTour(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu tour:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8 text-center font-bold">Đang tải dữ liệu tour...</div>;
  if (!tour) return <div className="p-8 text-center text-red-500">Tour không tồn tại!</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cột trái: Thông tin tour */}
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {tour.name} {/* Thay tên thật */}
          </h1>
          
          {/* Ảnh: Kiểm tra nếu có image_url thì hiển thị, không thì để placeholder */}
          <div className="bg-gray-200 h-96 rounded-xl mb-6 overflow-hidden">
            {tour.image_url && (
              <img src={tour.image_url} className="w-full h-full object-cover" alt={tour.name} />
            )}
          </div>

          <div className="prose max-w-none">
            <h3 className="text-2xl font-bold mb-2">Lịch trình</h3>
            {/* Thay mô tả thật */}
            <p className="whitespace-pre-line">{tour.description || "Đang cập nhật nội dung..."}</p>
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
            >
              Đặt Tour Ngay
            </a>
            <p className="text-xs text-center text-gray-500 mt-4 font-medium">
              Hoàn hủy miễn phí trong 24h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}