// app/(main)/tours/[id]/page.tsx
"use client"; 
export default function TourDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cột trái: Thông tin tour */}
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Chi tiết Tour (ID: {params.id})
          </h1>
          <div className="bg-gray-200 h-96 rounded-xl mb-6"></div> {/* Ảnh */}
          <div className="prose max-w-none">
            <h3 className="text-2xl font-bold mb-2">Lịch trình</h3>
            <p>Sáng: Đón khách...</p>
            <p>Chiều: Tham quan...</p>
          </div>
        </div>

        {/* Cột phải: Form đặt tour */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
            <p className="text-gray-500 mb-1">Giá mỗi khách</p>
            <p className="text-3xl font-bold text-emerald-600 mb-6">5.000.000đ</p>
            
            <a 
              href="/checkout" 
              className="block w-full text-center bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Đặt Tour Ngay
            </a>
            <p className="text-xs text-center text-gray-500 mt-4">
              Hoàn hủy miễn phí trong 24h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}