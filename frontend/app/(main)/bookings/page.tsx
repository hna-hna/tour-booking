"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Booking {
  id: number;
  tour_name: string;
  tour_image?: string;
  total_price: number;
  guest_count: number;
  status: string;
  booking_date: string;
  tour_id: number;
  cancel_reason?: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("http://127.0.0.1:5000/api/orders/my-orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          alert("Phiên đăng nhập hết hạn!");
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không thể tải danh sách");

        const bookingList = data.orders || [];
        setBookings(bookingList);
        setFilteredBookings(bookingList);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
        setBookings([]);
        setFilteredBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  // 2. Bộ lọc
  useEffect(() => {
    let result = [...bookings];

    if (searchTerm) {
      result = result.filter((b) =>
        b.tour_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    setFilteredBookings(result);
  }, [bookings, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "completed": return "bg-blue-100 text-blue-700";
      case "cancelled": return "bg-red-100 text-red-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getCancelReasonText = (reason: string) => {
    switch (reason) {
      case "expired":
        return "Quá hạn thanh toán";
      case "user_cancelled":
        return "Bạn đã hủy";
      default:
        return "";
    }
  };


  const getStatusText = (status: string, reason?: string) => {
    if (status === "cancelled" && reason === "expired") {
      return "Đã hủy quá hạn thanh toán";
    }
    const map: { [key: string]: string } = {
      paid: "Đã thanh toán",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
      pending: "Chờ thanh toán",
    };
    return map[status] || status;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header & Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Đơn đặt tour của tôi</h1>

        <div className="flex flex-wrap gap-2 justify-center">
          {["all", "paid", "completed", "cancelled", "pending"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === st
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
            >
              {st === "all" ? "Tất cả" : getStatusText(st)}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên tour..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
          {error}
        </div>
      ) : (
        <div className="grid gap-6">
          {(filteredBookings || []).map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all flex flex-col md:flex-row gap-6 shadow-sm"
            >
              {/* Image Section */}
              <div className="w-full md:w-48 h-40 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                {booking.tour_image ? (
                  <img
                    src={booking.tour_image}
                    alt={booking.tour_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>

              {/* Info Section */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{booking.tour_name}</h3>
                  <div className="flex flex-col items-end">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status, booking.cancel_reason)}
                    </span>

                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1 uppercase text-[10px] font-bold">Số khách</p>
                    <p className="font-bold text-gray-700">{booking.guest_count} người</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1 uppercase text-[10px] font-bold">Tổng tiền</p>
                    <p className="font-bold text-emerald-600 text-lg">
                      {booking.total_price?.toLocaleString()}đ
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1 uppercase text-[10px] font-bold">Ngày đặt</p>
                    <p className="font-bold text-gray-700">
                      {new Date(booking.booking_date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex flex-col gap-3 md:w-44 justify-center">
                {booking.status === "completed" ? (
                  <button
                    onClick={() => router.push(`/reviews?tour_id=${booking.tour_id}&order_id=${booking.id}`)}
                    className="bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-amber-200 transition-all active:scale-95"
                  >
                    Đánh giá Tour
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(`/tours/${booking.tour_id}`)}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold text-sm transition-colors"
                  >
                    Xem Tour
                  </button>
                )}

                <button
                  onClick={() => router.push(`/bookings/${booking.id}`)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all"
                >
                  Chi tiết đơn
                </button>

                {booking.status === "pending" && (
                  <button
                    onClick={() => router.push(`/payments?id=${booking.tour_id}&orderId=${booking.id}&amount=${booking.total_price}&guests=${booking.guest_count}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    Thanh toán ngay
                  </button>
                )}
              </div>
            </div>
          ))}

          {(!filteredBookings || filteredBookings.length === 0) && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-lg">Không tìm thấy đơn đặt tour nào phù hợp.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}