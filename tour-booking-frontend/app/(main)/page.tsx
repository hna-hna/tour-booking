
export default function ToursPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Danh sách Tour du lịch</h2>
      <p className="text-gray-600">Dữ liệu từ bảng "tours" trong PostgreSQL sẽ hiển thị ở đây.</p>
      {/* Sau này sẽ thêm phần fetch dữ liệu từ Flask API */}
    </div>
  )
}