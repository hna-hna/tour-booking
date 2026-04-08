"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Link from "next/link";

interface MyTour {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function GuideDashboard() {
  const [tours, setTours] = useState<MyTour[]>([]);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);

  // --- STATE CHO BỘ LỌC ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("earliest"); // earliest | latest

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Không tìm thấy token. Vui lòng đăng nhập!");
      return;
    }

    axios.get("http://127.0.0.1:5000/api/guide/tours", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        setTours(res.data);
      })
      .catch((err) => {
        console.error("Lỗi gọi API:", err);
      });
  }, []);

  // --- LOGIC LỌC VÀ SẮP XẾP ---
  const filteredTours = useMemo(() => {
    // 1. Lọc theo tên
    let result = tours.filter((t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sắp xếp theo ngày khởi hành
    result.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return sortOrder === "earliest" ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [tours, searchTerm, sortOrder]);

  const handleOpenRevenueModal = async (tour: MyTour) => {
    setSelectedTour(tour);
    setRevenueModalOpen(true);
    setRevenueData(null);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://127.0.0.1:5000/api/guide/tours/${tour.id}/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRevenueData(res.data);
    } catch (err) {
      console.error("Lỗi lấy doanh thu:", err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
          Lịch Dẫn Tour Của Tôi
        </h1>
        
        {/* THANH CÔNG CỤ LỌC */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="TÌM TÊN TOUR..." 
            className="bg-white border-2 border-black px-4 py-2 text-xs font-black uppercase tracking-widest focus:bg-yellow-50 rounded-2xl shadow-sm outline-none w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="bg-black text-white border-2 rounded-2xl shadow-sm border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="earliest">KHỞI HÀNH: SỚM NHẤT</option>
            <option value="latest">KHỞI HÀNH: TRỄ NHẤT</option>
          </select>
        </div>
      </div>
      
      {filteredTours.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] text-center shadow-xl border border-dashed border-gray-200">
          <p className="text-gray-400 mb-4 font-medium italic">Không tìm thấy tour nào khớp với yêu cầu.</p>
          <button 
            onClick={() => {setSearchTerm(""); setSortOrder("earliest");}}
            className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline"
          >
            LÀM MỚI BỘ LỌC
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTours.map((tour) => (
            <div key={tour.id} className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden hover:translate-y-[-5px] transition-all duration-300 group">
              <div className="h-32 bg-gradient-to-br from-emerald-500 to-teal-700 p-6 flex flex-col justify-end relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <p 
                  className="text-white font-black text-xl leading-tight line-clamp-2 cursor-pointer hover:underline relative z-10"
                  onClick={() => handleOpenRevenueModal(tour)}
                >
                  {tour.name}
                </p>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between text-sm mb-6 grayscale group-hover:grayscale-0 transition-all">
                  <div className="bg-gray-50 p-3 rounded-2xl flex-1 mr-2 border border-transparent group-hover:border-emerald-100">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Khởi hành</p>
                    <p className="font-bold text-gray-800">
                        {tour.start_date ? new Date(tour.start_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl flex-1">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 text-right">Kết thúc</p>
                    <p className="font-bold text-gray-800 text-right">
                        {tour.end_date ? new Date(tour.end_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                
                <Link 
                  href={`/guide/tours/${tour.id}`} 
                  className="flex items-center justify-center w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                >
                   CHI TIẾT
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DOANH THU CHO HDV */}
      {revenueModalOpen && selectedTour && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
            <button 
              onClick={() => setRevenueModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black text-2xl font-bold"
            >
              DÓNG [X]
            </button>
            <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tighter">Thu nhập của bạn</h2>
            <p className="text-sm text-gray-500 font-medium mb-8 italic">Theo dõi hoa hồng từ tour: <span className="text-emerald-600 font-bold">{selectedTour.name}</span></p>

            {!revenueData ? (
              <div className="py-10 text-center animate-pulse text-gray-400 italic font-black uppercase text-xs">Đang tổng hợp...</div>
            ) : (
              <div className="space-y-6">
                <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
                  <div className="absolute right-[-10%] top-[-10%] w-20 h-20 bg-emerald-600/10 rounded-full blur-xl"></div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 relative z-10">Hoa hồng thực nhận (10%)</p>
                  <p className="text-4xl font-black text-emerald-700 relative z-10">{(revenueData.guide_commission || 0).toLocaleString()}đ</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tổng thu tour</span>
                    <span className="font-bold text-slate-800">{(revenueData.total_revenue || 0).toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tỷ lệ % nhận</span>
                    <span className="font-bold text-emerald-600">{revenueData.commission_rate}</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => setRevenueModalOpen(false)}
              className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              Xác nhận báo cáo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}