"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Review {
  id: number;
  full_name: string;
  tour_name: string;
  rating: number;
  comment: string;
}

export default function AboutPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/api/reviews")
      .then(res => setReviews(res.data))
      .catch(err => console.error("Lỗi lấy review:", err));
  }, []);

  useEffect(() => {
    if (reviews.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const coreValues = [
    {
      title: "Du lịch bền vững",
      desc: "Tôn trọng văn hóa bản địa và bảo vệ môi trường trong từng hành trình."
    },
    {
      title: "Công nghệ AI",
      desc: "Hệ thống gợi ý thông minh dựa trên thói quen và sở thích cá nhân."
    },
    {
      title: "Kết nối tức thì",
      desc: "Trò chuyện trực tiếp với hướng dẫn viên để có thông tin chính xác nhất."
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden text-slate-800">
      
      {/* HERO SECTION */}
      <section className="relative h-[70vh] flex items-center justify-center bg-slate-900">
        <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter">
              Về <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Tour Booking</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-light tracking-wide">
              Nền tảng du lịch thông minh, kết nối cảm xúc và trải nghiệm Việt Nam theo cách hoàn toàn mới.
            </p>
          </motion.div>
        </div>
      </section>

      {/* GIỚI THIỆU & GIÁ TRỊ CỐT LÕI */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="relative">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-[0.2em] text-emerald-700 bg-emerald-100 rounded-full uppercase">
                Câu chuyện của chúng tôi
              </span>
              <h3 className="text-5xl font-bold text-slate-900 leading-[1.1]">
                Xây dựng bởi đam mê công nghệ và tình yêu đất nước.
              </h3>
            </div>
            <p className="text-xl text-slate-600 leading-relaxed font-light">
              TravelVN không chỉ là một ứng dụng đặt tour. Đó là sản phẩm trí tuệ của sinh viên 
              <span className="font-semibold text-slate-900"> Công nghệ Thông tin</span>, nơi AI được thổi hồn vào từng hành trình.
            </p>
          </div>

          <div className="grid gap-6">
            {coreValues.map((value, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.02, x: 10 }}
                className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col gap-2 transition-all"
              >
                <h4 className="font-bold text-2xl text-slate-900">{value.title}</h4>
                <p className="text-slate-500 text-lg leading-snug">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BẢN ĐỒ */}
      <section className="bg-slate-50 py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Phủ sóng khắp các vùng miền Việt Nam</h2>
            <div className="w-24 h-1.5 bg-emerald-500 mx-auto mt-6 rounded-full" />
          </div>
          <div className="rounded-[3rem] overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] border-[12px] border-white">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15739733.4251419!2d96.53931659723326!3d15.607421876527501!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31157a4d736a1e5f%3A0x64050a9117606346!2zVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1711980000000!5m2!1svi!2s"
              width="100%"
              height="550"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="border-0 grayscale hover:grayscale-0 transition-all duration-700"
            ></iframe>
          </div>
        </div>
      </section>

      {/* PHẦN ĐÁNH GIÁ KHÁCH HÀNG */}
      <section className="py-32 bg-white relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center mb-20 text-center">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Cảm nhận từ khách hàng</h2>
            <p className="text-slate-500 mt-4 text-lg font-light tracking-wide">NHỮNG CÂU CHUYỆN THẬT TỪ NHỮNG HÀNH TRÌNH THẬT</p>
          </div>
          
          <div className="relative px-4">
            <AnimatePresence mode="wait">
              {reviews.length > 0 && (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="relative bg-slate-900 text-white rounded-[3rem] p-10 md:p-16 shadow-[0_40px_80px_-15px_rgba(15,23,42,0.3)] border border-white/10">
                    <div className="grid md:grid-cols-5 gap-12">
                      <div className="md:col-span-2 space-y-8 border-r border-white/10 pr-8">
                        <div>
                          <p className="uppercase text-emerald-400 text-xs font-black tracking-[0.2em] mb-2">Khách hàng</p>
                          <p className="text-3xl font-bold tracking-tight">{reviews[currentIndex].full_name}</p>
                        </div>
                        <div>
                          <p className="uppercase text-blue-400 text-xs font-black tracking-[0.2em] mb-2">Hành trình</p>
                          <p className="text-xl font-medium text-slate-300">{reviews[currentIndex].tour_name}</p>
                        </div>
                        <div>
                          <p className="uppercase text-yellow-400 text-xs font-black tracking-[0.2em] mb-4">Chất lượng</p>
                          <div className="flex gap-1 text-2xl">
                            {"★".repeat(reviews[currentIndex].rating)}
                            <span className="text-slate-700">{"★".repeat(5 - reviews[currentIndex].rating)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-3 flex flex-col justify-center">
                        <p className="uppercase text-purple-400 text-xs font-black tracking-[0.2em] mb-6">Nhận xét</p>
                        <p className="text-2xl md:text-3xl font-light italic leading-relaxed text-slate-100">
                          "{reviews[currentIndex].comment}"
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons (Sử dụng chữ thay cho icon) */}
            <div className="flex justify-center gap-10 mt-12">
              <button 
                onClick={handlePrev}
                className="text-sm font-black tracking-widest uppercase text-slate-400 hover:text-emerald-600 transition-all"
              >
                Trở lại
              </button>
              <button 
                onClick={handleNext}
                className="text-sm font-black tracking-widest uppercase text-slate-400 hover:text-emerald-600 transition-all"
              >
                Tiếp theo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="relative py-28 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-emerald-700" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-5xl font-black text-white mb-8">Bạn đã sẵn sàng xách vali lên chưa?</h2>
          <p className="text-xl text-emerald-50 mb-12 opacity-80 font-light">Cùng TravelVN kiến tạo những kỷ niệm không thể quên trên khắp dải đất hình chữ S.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/tours" className="px-12 py-5 bg-white text-emerald-700 font-black rounded-2xl hover:shadow-xl transition-all">
              KHÁM PHÁ NGAY
            </Link>
            <Link href="/register" className="px-12 py-5 border-2 border-white text-white font-black rounded-2xl hover:bg-white hover:text-emerald-700 transition-all">
              HỢP TÁC VỚI CHÚNG TÔI
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}