"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface Tour {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
}

export default function ToursListPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/api/tours")
      .then((res) => setTours(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8">Đang tải tour...</p>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Tất cả Tour du lịch
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tours.map((tour) => (
          <div
            key={tour.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition"
          >
            <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
  {tour.image ? (
    <img
      src={tour.image}
      alt={tour.name}
      className="w-full h-full object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=No+Image";
      }}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-400">
      Không có ảnh
    </div>
  )}
</div>

            <div className="p-4">
              <h3 className="font-bold text-xl mb-2">{tour.name}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {tour.description || ""}
              </p>

              <div className="flex justify-between items-center">
                <span className="text-emerald-600 font-bold">
                  {tour.price.toLocaleString()} đ
                </span>

                <Link
                  href={`/tours/${tour.id}`}
                  className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
