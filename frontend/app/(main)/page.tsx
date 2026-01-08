// app/(main)/page.tsx
import Link from "next/link";

export default function HomePage() {
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
      
      <h2 className="text-3xl font-bold mb-6">Tour nổi bật</h2>
      <p>Danh sách tour gợi ý (AI Recommendation) sẽ hiện ở đây...</p>
    </div>
  );
}