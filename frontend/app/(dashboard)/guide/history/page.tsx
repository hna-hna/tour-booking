"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function GuideTourHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API lấy các tour HDV đã được phân công (assigned)
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/guide/tours/history");
        setHistory(res.data);
      } catch (err) {
        console.error("Lỗi tải lịch sử tour:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 italic text-gray-500">
        Đang tải lịch sử hành trình...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Lịch sử Tour</h1>
          <p className="text-gray-500 mt-1">Các tour bạn đã dẫn dắt và đồng hành</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
            Tổng cộng: {history.length} Tour
          </span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl p-20 text-center border border-dashed border-gray-300">
          <p className="text-gray-400">Bạn chưa hoàn thành tour nào trong lịch sử.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    ID Assignment: #{item.id}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    item.status === 'completed' || item.status === 'finished' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.status === 'completed' ? 'Hoàn thành' : 'Đã kết thúc'}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-800 text-lg mb-3 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                  {item.tour_name}
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-500 gap-3">
                    <span className="w-5 text-center"></span>
                    <span>Khởi hành: {new Date(item.start_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 gap-3">
                    <span className="w-5 text-center"></span>
                    <span className="truncate">{item.location || "Đang cập nhật địa điểm"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                   <div className="text-[10px] text-gray-400">
                      Ngày phân công: {new Date(item.assigned_date).toLocaleDateString('vi-VN')}
                   </div>
                   <Link 
                    href={`/guide/tours/${item.tour_id}`}
                    className="text-xs font-bold text-cyan-600 hover:underline"
                  >
                    Chi tiết →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}