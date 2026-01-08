// app/(main)/tours/page.tsx
import Link from "next/link";

export default function ToursListPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Tất cả Tour du lịch</h2>
      
      {/* Giả lập danh sách tour */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="h-48 bg-gray-300 w-full"></div> {/* Chỗ để ảnh */}
            <div className="p-4">
              <h3 className="font-bold text-xl mb-2">Tour Du Lịch Số {item}</h3>
              <p className="text-gray-600 mb-4">Mô tả ngắn về tour...</p>
              <div className="flex justify-between items-center">
                <span className="text-emerald-600 font-bold">5.000.000đ</span>
                <Link 
                  href={`/tours/${item}`} 
                  className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}