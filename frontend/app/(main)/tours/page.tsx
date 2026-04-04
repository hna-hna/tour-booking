"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface Tour {
  id: number;
  name: string;
  price: number;
  description: string;
  itinerary: string;
  image: string;
  start_date?: string;
  end_date?: string;
}

export default function ToursListPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [popularTours, setPopularTours] = useState<Tour[]>([]);
  const [recommendedTours, setRecommendedTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [startDate, setStartDate] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch dữ liệu
  const fetchAllTours = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tours");
      setTours(res.data);
      setFilteredTours(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPopularTours = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tours/popular");
      setPopularTours(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendedTours = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5000/api/tours/recommend", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendedTours(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllTours();
    fetchPopularTours();
    if (token) fetchRecommendedTours();
    setLoading(false);
  }, [token]);

  // Áp dụng filter
  useEffect(() => {
    let result = [...tours];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tour =>
        tour.name.toLowerCase().includes(term) ||
        (tour.description && tour.description.toLowerCase().includes(term)) ||
        (tour.itinerary && tour.itinerary.toLowerCase().includes(term))
      );
    }

    if (minPrice) result = result.filter(t => t.price >= Number(minPrice));
    if (maxPrice) result = result.filter(t => t.price <= Number(maxPrice));

    if (startDate) {
      result = result.filter(tour => {
        if (!tour.start_date) return false;
        return new Date(tour.start_date).toISOString().split('T')[0] === startDate;
      });
    }

    setFilteredTours(result);
  }, [tours, searchTerm, minPrice, maxPrice, startDate]);

  if (loading) return <div className="p-8 text-center">Đang tải danh sách tour...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Tiêu đề + Thanh tìm kiếm nổi bật ở đầu trang */}
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Khám phá tất cả Tour</h1>
        <p className="text-gray-600 mb-8">Hàng trăm hành trình chất lượng đang chờ bạn</p>

        {/* Thanh tìm kiếm chính - Đưa lên đầu */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tìm kiếm tour</label>
              <input
                type="text"
                placeholder="Tìm theo tên tour, mô tả hoặc lịch trình..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-4 text-lg border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:w-48">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Ngày khởi hành</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:w-48">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Giá từ</label>
              <input
                type="number"
                placeholder="Tối thiểu"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:w-48">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Giá đến</label>
              <input
                type="number"
                placeholder="Tối đa"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN GỢI Ý & TOUR NỔI BẬT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Gợi ý cá nhân hóa */}
        {token && recommendedTours.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"> Gợi ý dành riêng cho bạn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {recommendedTours.slice(0, 4).map(tour => (
                <Link key={tour.id} href={`/tours/${tour.id}`} className="block group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-xl transition">
                    <img src={tour.image} alt={tour.name} className="w-full h-40 object-cover group-hover:scale-105 transition" />
                    <div className="p-4">
                      <h3 className="font-bold text-lg line-clamp-2">{tour.name}</h3>
                      <p className="text-emerald-600 font-bold mt-2">{tour.price.toLocaleString()} đ</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tour nổi bật */}
        <div>
          <h2 className="text-2xl font-bold mb-6"> Tour nổi bật</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {popularTours.slice(0, 4).map(tour => (
              <Link key={tour.id} href={`/tours/${tour.id}`} className="block group">
                <div className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-xl transition">
                  <img src={tour.image} alt={tour.name} className="w-full h-40 object-cover group-hover:scale-105 transition" />
                  <div className="p-4">
                    <h3 className="font-bold text-lg line-clamp-2">{tour.name}</h3>
                    <p className="text-emerald-600 font-bold mt-2">{tour.price.toLocaleString()} đ</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* DANH SÁCH TOUR */}
      <h2 className="text-3xl font-bold mb-8">Tất cả Tour ({filteredTours.length})</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredTours.map(tour => (
          <Link key={tour.id} href={`/tours/${tour.id}`} className="block group">
            <div className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-2xl transition-all">
              <div className="h-52 bg-gray-200 relative">
                <img
                  src={tour.image || "https://via.placeholder.com/400x300?text=No+Image"}
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-xl line-clamp-2 group-hover:text-emerald-600 transition">{tour.name}</h3>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{tour.description}</p>
                <div className="flex justify-between items-end mt-6">
                  <span className="text-emerald-600 font-bold text-2xl">
                    {tour.price.toLocaleString()} đ
                  </span>
                  <button className="px-5 py-2 border border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition text-sm font-medium">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredTours.length === 0 && (
        <div className="text-center py-20 text-gray-500 text-lg">
          Không tìm thấy tour nào phù hợp với từ khóa bạn tìm.
        </div>
      )}
    </div>
  );
}