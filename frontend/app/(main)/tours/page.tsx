/*Danh sách tour + Bộ lọc + Thanh tìm kiếm*/
export default function ToursPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Danh sách Tour du lịch</h2>
      
      {/* Khu vực bộ lọc (Search/Filter) */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
         <p>Bộ lọc tour sẽ nằm ở đây...</p>
      </div>

      {/* Grid hiển thị tour */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Map dữ liệu tour vào đây */}
         <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold">Tour mẫu Sapa</h3>
            <a href="/tours/1" className="text-emerald-600 hover:underline">Xem chi tiết</a>
         </div>
      </div>
    </div>
  )
}