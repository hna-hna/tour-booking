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

  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [startDate, setStartDate] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, popularRes] = await Promise.all([
          axios.get("http://localhost:5000/api/tours"),
          axios.get("http://localhost:5000/api/tours/popular")
        ]);

        setTours(allRes.data);
        setFilteredTours(allRes.data);
        setPopularTours(popularRes.data);

        if (token) {
          try {
            const recRes = await axios.get("http://localhost:5000/api/tours/recommend", {
              headers: { Authorization: `Bearer ${token}` }
            });
            setRecommendedTours(recRes.data);
          } catch (e) {
            console.log("Không có gợi ý riêng.");
          }
        }
      } catch (err) {
        console.error("Lỗi tải tour:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Bộ lọc logic
  useEffect(() => {
    let result = [...tours];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(tour =>
        tour.name.toLowerCase().includes(term) ||
        (tour.description && tour.description.toLowerCase().includes(term))
      );
    }

    if (minPrice.trim() || maxPrice.trim()) {
      result = result.filter(tour => {
        const priceStr = String(tour.price);
        const minP = minPrice.trim();
        const maxP = maxPrice.trim();
        const matchMin = minP === "" || priceStr.startsWith(minP);
        let matchMax = true;
        if (maxP !== "") {
          if (maxP.length < priceStr.length) {
            matchMax = priceStr.startsWith(maxP) || parseInt(priceStr[0]) <= parseInt(maxP[0]);
          } else {
            matchMax = tour.price <= parseFloat(maxP);
          }
        }
        return matchMin && matchMax;
      });
    }

    if (startDate) {
      result = result.filter(tour => {
        if (!tour.start_date) return false;
        return new Date(tour.start_date).toISOString().split('T')[0] === startDate;
      });
    }
    setFilteredTours(result);
  }, [tours, searchTerm, minPrice, maxPrice, startDate]);

  const resetFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setStartDate("");
  };

  const getDisplayTours = () => {
    if (token && recommendedTours.length > 0) {
      const rec = recommendedTours.slice(0, 3);
      const pop = popularTours.filter(p => !rec.find(r => r.id === p.id)).slice(0, 1);
      return [...rec, ...pop];
    }
    return popularTours.slice(0, 4);
  };

  const displayTours = getDisplayTours();

  if (loading) return <div className="p-8 text-center font-bold">Đang tải...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      {/* Search & Filter */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm tour..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-[2] px-6 py-3 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm shadow-sm"
          />
          <div className="flex-1 flex gap-4 items-center">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest min-w-[70px]">Ngày đi</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm shadow-sm"
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-4 items-center">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest min-w-[70px]">Giá từ</span>
            <input
              type="text"
              placeholder="Nhập số đầu..."
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm shadow-sm"
            />
          </div>
          <div className="flex-1 flex gap-4 items-center">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest min-w-[70px]">Đến</span>
            <input
              type="text"
              placeholder="Nhập số đầu..."
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm shadow-sm"
            />
          </div>
          <button 
            onClick={resetFilters} 
            className="px-6 py-3 text-xs font-black text-gray-400 uppercase hover:text-red-500 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Section Gộp */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
              {token && recommendedTours.length > 0 ? "Gợi ý dành riêng cho bạn" : "Tour nổi bật hiện tại"}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayTours.map((tour, index) => (
            <Link key={tour.id} href={`/tours/${tour.id}`} className="group">
              <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-50 hover:shadow-2xl transition-all">
                <div className="h-40 relative">
                  <img src={tour.image} className="w-full h-full object-cover" alt="" />
                  {token && index < 3 
                  }
                </div>
                <div className="p-4">
                  <h3 className="font-black text-gray-800 text-sm line-clamp-1">{tour.name}</h3>
                  <p className="text-emerald-600 font-black text-lg mt-2">{Number(tour.price).toLocaleString()} đ</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tất cả Tour */}
      <section className="pt-8">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
          Tất cả Tour ({filteredTours.length})
          <span className="h-[2px] flex-1 bg-gray-100"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredTours.map(tour => (
            <Link key={tour.id} href={`/tours/${tour.id}`} className="group">
              <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-50 hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="h-56">
                  <img src={tour.image} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="p-6">
                  <h3 className="font-black text-gray-900 text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors">{tour.name}</h3>
                  <p className="text-gray-400 text-[11px] font-bold uppercase mt-2 line-clamp-2">{tour.description || "Hành trình khám phá"}</p>
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-xl font-black text-gray-900">{Number(tour.price).toLocaleString()} đ</p>
                    <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white group-hover:bg-emerald-600 transition-colors">
                      →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}