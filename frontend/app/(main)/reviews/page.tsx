"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";

export default function ReviewFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tour_id = searchParams.get("tour_id");
  const order_id = searchParams.get("order_id");

  const [tourName, setTourName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lấy tên tour để hiển thị
  useEffect(() => {
    if (!tour_id) return;

    axios.get(`http://localhost:5000/api/tours/${tour_id}`)
      .then(res => setTourName(res.data.name || "Tour này"))
      .catch(() => setTourName("Tour này"));
  }, [tour_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour_id || !order_id) {
      alert("Thiếu thông tin tour hoặc đơn hàng!");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/reviews", {
        tour_id: parseInt(tour_id),
        order_id: parseInt(order_id),
        rating,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubmitted(true);
      alert("Cảm ơn bạn đã đánh giá tour!");
      
      // Quay về trang lịch sử sau 2 giây
      setTimeout(() => {
        router.push("/bookings");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Đánh giá thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-emerald-600 mb-2">Cảm ơn bạn!</h2>
          <p className="text-gray-600">Đánh giá của bạn đã được ghi nhận.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900">Đánh giá Tour</h1>
          <p className="text-xl text-emerald-600 mt-2 font-medium">{tourName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Rating sao */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Bạn đánh giá tour này bao nhiêu sao?</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-5xl transition-transform hover:scale-110 ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-center mt-2 text-sm text-gray-500">{rating} sao</p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nhận xét của bạn</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hãy chia sẻ cảm nhận của bạn về tour này..."
              rows={6}
              className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !comment.trim()}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-2xl transition shadow-lg"
          >
            {loading ? "Đang gửi đánh giá..." : "Gửi đánh giá"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/bookings")}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Quay lại lịch sử đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}