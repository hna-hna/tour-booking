// app/(main)/bookings/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "/login";
                return;
            }

            const res = await axios.get("http://localhost:5000/api/orders/my-orders", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setBookings(res.data);
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

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancel = async (orderId: number) => {
        if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không? Tiền sẽ được hoàn lại vào tài khoản của bạn theo chính sách.")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:5000/api/orders/${orderId}/cancel`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            alert("Hủy đơn hàng thành công!");
            fetchBookings(); // Tải lại danh sách
        } catch (error) {
            console.error("Lỗi khi hủy đơn:", error);
            alert("Không thể hủy đơn hàng lúc này.");
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending": return <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded font-bold text-xs uppercase">Chờ xử lý</span>;
            case "paid": return <span className="text-emerald-600 bg-emerald-100 px-2 py-1 rounded font-bold text-xs uppercase">Đã thanh toán</span>;
            case "cancelled": return <span className="text-red-600 bg-red-100 px-2 py-1 rounded font-bold text-xs uppercase">Đã hủy</span>;
            case "completed": return <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded font-bold text-xs uppercase">Đã hoàn thành</span>;
            default: return <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded font-bold text-xs uppercase">{status}</span>;
        }
    };

    if (loading) {
        return <div className="p-8 text-center font-bold text-gray-500">Đang tải lịch sử đặt tour...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Lịch sử đặt Tour</h1>

                {bookings.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 mb-4">Bạn chưa đặt tour nào cả.</p>
                        <a href="/tours" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
                            Khám phá Tour ngay
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center">
                                {/* Ảnh Tour */}
                                <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                    {booking.tour_image ? (
                                        <img src={booking.tour_image} alt={booking.tour_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Không có ảnh</div>
                                    )}
                                </div>

                                {/* Thông tin */}
                                <div className="flex-1 w-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{booking.tour_name || `Lỗi tên tour #${booking.tour_id}`}</h3>
                                        {getStatusText(booking.status)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mb-4">
                                        <p><strong>Mã đơn:</strong> #{booking.id}</p>
                                        <p><strong>Ngày đặt:</strong> {new Date(booking.booking_date).toLocaleDateString("vi-VN")}</p>
                                        <p><strong>Số lượng:</strong> {booking.guest_count} khách</p>
                                        <p><strong>Tổng tiền:</strong> <span className="font-bold text-emerald-600">{booking.total_price.toLocaleString()}đ</span></p>
                                    </div>

                                    {/* Nút thao tác */}
                                    {["pending", "paid", "Đã thanh toán"].includes(booking.status) && (() => {
                                        const isWithin24h = new Date().getTime() - new Date(booking.booking_date).getTime() <= 24 * 3600 * 1000;
                                        return isWithin24h ? (
                                            <div className="flex justify-end mt-4 pt-4 border-t border-gray-50">
                                                <button
                                                    onClick={() => handleCancel(booking.id)}
                                                    className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded transition"
                                                >
                                                    Hủy đơn & Hoàn tiền
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end mt-4 pt-4 border-t border-gray-50">
                                                <span className="text-gray-400 text-sm italic">Quá hạn hủy miễn phí (24h)</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
