"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Booking {
  id: number;
  tour_name: string;
  image: string;
  start_date: string;
  booking_date: string;
  guest_count: number;
  total_price: number;
  status: string;
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Hàm tải dữ liệu
  const fetchBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await axios.get("http://localhost:5000/api/history/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 2. Hàm xử lý Hủy đơn
  const handleCancel = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/history/orders/${id}/cancel`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Đã hủy đơn thành công!");
      fetchBookings(); // Tải lại danh sách để cập nhật trạng thái mới
    } catch (error: any) {
      alert(error.response?.data?.msg || "Lỗi khi hủy đơn");
    }
  };

  // 3. Hàm render màu sắc trạng thái (Badge)
  const renderStatus = (status: string) => {
    const styles: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
    };
    
    // Dịch tiếng Việt
    const labels: { [key: string]: string } = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      cancelled: "Đã hủy",
      completed: "Đã hoàn thành",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-100"}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Lịch sử đặt Tour của bạn</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Bạn chưa có đơn đặt tour nào.</p>
          <Link href="/tours" className="text-emerald-600 font-bold hover:underline">
            Khám phá tour ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row justify-between">
                
                {/* Thông tin chính */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-400">#{item.id}</span>
                    {renderStatus(item.status)}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.tour_name}</h3>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>🗓 Ngày khởi hành: <span className="font-semibold">{item.start_date}</span></p>
                    <p>👥 Số khách: {item.guest_count} người</p>
                    <p>🕒 Ngày đặt: {item.booking_date}</p>
                  </div>
                </div>

                {/* Giá tiền và Nút bấm */}
                <div className="mt-4 md:mt-0 md:text-right flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng tiền</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {item.total_price.toLocaleString()} đ
                    </p>
                  </div>

                  <div className="mt-4 flex gap-3 justify-end">
                    {/* Chỉ hiện nút Hủy và Thanh toán khi đang Pending */}
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                          Hủy đơn
                        </button>
                        <Link
                          href={`/payment?orderId=${item.id}`} // Link sang trang thanh toán
                          className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                        >
                          Thanh toán ngay
                        </Link>
                      </>
                    )}
                    
                    {/* Nút xem chi tiết (Optional) */}
                    <Link
                      href={`/tours/${item.id}`} // Link về lại trang tour để xem lại
                      className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Xem Tour
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}