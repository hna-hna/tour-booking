/*trang chi tiết từng tour*/
export default function TourDetailPage({ params }: { params: { id: string } }) {
  // params.id chính là ID của tour lấy từ URL
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-emerald-700">Chi tiết Tour ID: {params.id}</h1>
      <p className="mt-4">Thông tin chi tiết, lịch trình, giá vé sẽ hiển thị tại đây.</p>
      
      <a href="/checkout" className="mt-6 inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700">
        Đặt ngay tour này
      </a>
    </div>
  );
}