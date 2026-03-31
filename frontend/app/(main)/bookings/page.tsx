"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Các state cho filter
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
    const [selectedDate, setSelectedDate] = useState("");
    const [guestFilter, setGuestFilter] = useState<number | "">("");

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const res = await axios.get("http://localhost:5000/api/orders/my-orders", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data);
            setFilteredBookings(res.data);
        } catch (error: any) {
            console.error("Lỗi lấy danh sách đơn hàng:", error);
            if (error.response?.status === 401) {
                alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
                localStorage.removeItem("token");
                window.location.href = "/login";
            }
        } finally {
            setLoading(false);
        }
    };

    // Áp dụng filter & sort
    useEffect(() => {
        let result = [...bookings];

        // Lọc theo tên tour
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(b => 
                b.tour_name?.toLowerCase().includes(term)
            );
        }

        // Lọc theo ngày cụ thể
        if (selectedDate) {
            result = result.filter(b => {
                const bookingDate = new Date(b.booking_date).toISOString().split('T')[0];
                return bookingDate === selectedDate;
            });
        }

        // Lọc theo số lượng khách
        if (guestFilter !== "") {
            result = result.filter(b => b.guest_count === Number(guestFilter));
        }

        // Sắp xếp
        result.sort((a, b) => {
            const dateA = new Date(a.booking_date).getTime();
            const dateB = new Date(b.booking_date).getTime();
            return sortBy === "newest" ? dateB - dateA : dateA - dateB;
        });

        setFilteredBookings(result);
    }, [bookings, searchTerm, sortBy, selectedDate, guestFilter]);

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (orderId: number) => {
        if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Hủy đơn hàng thành công!");
            fetchBookings();
        } catch (error) {
            console.error("Lỗi khi hủy đơn:", error);
            alert("Không thể hủy đơn hàng lúc này.");
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending": return <span className="text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-xs font-bold">Chờ xử lý</span>;
            case "paid": return <span className="text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full text-xs font-bold">Đã thanh toán</span>;
            case "cancelled": return <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full text-xs font-bold">Đã hủy</span>;
            case "completed": return <span className="text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-xs font-bold">Đã hoàn thành</span>;
            default: return <span className="text-gray-500">{status}</span>;
        }
    };

    if (loading) {
        return <div className="p-8 text-center font-bold text-gray-500">Đang tải lịch sử đặt tour...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-black text-gray-900 mb-2">Lịch sử đặt Tour</h1>
                <p className="text-gray-600 mb-8">Quản lý tất cả các đơn đặt tour của bạn</p>

                {/* Bộ lọc */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tìm theo tên tour */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Tìm theo tên tour</label>
                        <input
                            type="text"
                            placeholder="Nhập tên tour..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Sắp xếp */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Sắp xếp theo</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="newest">Ngày đặt mới nhất</option>
                            <option value="oldest">Ngày đặt cũ nhất</option>
                        </select>
                    </div>

                    {/* Lọc theo ngày */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Ngày đặt cụ thể</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Lọc theo số lượng khách */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Số lượng khách</label>
                        <input
                            type="number"
                            placeholder="Ví dụ: 2"
                            value={guestFilter}
                            onChange={(e) => setGuestFilter(e.target.value ? Number(e.target.value) : "")}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {filteredBookings.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 mb-4">Không tìm thấy đơn hàng nào phù hợp.</p>
                        <button 
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedDate("");
                                setGuestFilter("");
                                setSortBy("newest");
                            }}
                            className="text-emerald-600 hover:underline"
                        >
                            Xóa tất cả bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredBookings.map((booking) => (
                            <div key={booking.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-all">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Ảnh tour */}
                                    <div className="w-full md:w-56 h-40 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                        {booking.tour_image ? (
                                            <img 
                                                src={booking.tour_image.startsWith('http') ? booking.tour_image : `http://localhost:5000/static/uploads/${booking.tour_image}`} 
                                                alt={booking.tour_name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">Không có ảnh</div>
                                        )}
                                    </div>

                                    {/* Thông tin */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-gray-900">{booking.tour_name}</h3>
                                            {getStatusText(booking.status)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-3 mt-4 text-sm">
                                            <p><strong>Mã đơn:</strong> #{booking.id}</p>
                                            <p><strong>Ngày đặt:</strong> {new Date(booking.booking_date).toLocaleDateString("vi-VN", { 
                                                year: 'numeric', month: 'long', day: 'numeric' 
                                            })}</p>
                                            <p><strong>Số khách:</strong> {booking.guest_count} người</p>
                                            <p><strong>Tổng tiền:</strong> <span className="font-bold text-emerald-600">{booking.total_price.toLocaleString()} ₫</span></p>
                                        </div>

                                        {/* Nút hành động */}
                                        <div className="flex flex-wrap gap-3 mt-6">
                                            <Link 
                                                href={`/bookings/${booking.id}`}
                                                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition font-medium"
                                            >
                                                Xem chi tiết
                                            </Link>

                                            {booking.status === "completed" && (
                                                <Link 
                                                    href={`/reviews/create?tour_id=${booking.tour_id}&order_id=${booking.id}`}
                                                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium flex items-center gap-2"
                                                >
                                                    ✍️ Đánh giá tour
                                                </Link>
                                            )}

                                            {["pending", "paid"].includes(booking.status) && (
                                                <button
                                                    onClick={() => handleCancel(booking.id)}
                                                    className="px-6 py-2.5 border border-red-500 text-red-600 hover:bg-red-50 rounded-xl transition font-medium"
                                                >
                                                    Hủy đơn hàng
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}