"use client";
import React, { useEffect, useState } from 'react';

export default function GuideStatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/admin/role-stats");
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenRevenueModal = async (tour: {id: number, name: string}) => {
    setSelectedTour(tour);
    setModalOpen(true);
    setRevenueData(null);

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/tours/${tour.id}/revenue-details`);
      if (res.ok) {
        setRevenueData(await res.json());
      }
    } catch (err) {
      console.error("Lỗi lấy doanh thu:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center font-bold text-amber-600 animate-pulse uppercase tracking-[0.2em]">Đang phân tích dữ liệu HDV...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6 no-print">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Hiệu suất Hướng dẫn viên</h1>
          <p className="text-slate-500 font-bold italic mt-2 text-sm italic">Thống kê khối lượng công việc và tần suất phân bổ tour</p>
        </div>
        <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-slate-800 transition-all font-black text-sm tracking-widest flex items-center gap-2 uppercase">
          Trình xuất dữ liệu (PDF)
        </button>
      </div>

      <div className="space-y-12">
        {/* Guide Section */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-amber-50/50 p-10 border-b border-slate-100 flex justify-between items-center group overflow-hidden">
            <div className="absolute right-[-10%] bottom-[-20%] w-48 h-48 bg-amber-500/5 rounded-full blur-3xl group-hover:scale-150 transition-all"></div>
            <div>
              <h2 className="text-2xl font-black text-amber-800 flex items-center gap-3">
                <span className="bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-xl font-bold">G</span>
                Đội ngũ Hướng dẫn viên
              </h2>
              <p className="text-sm text-amber-700/80 mt-1 font-black italic uppercase tracking-widest">Nguồn nhân lực thực tế trên hệ thống</p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Tổng nhân sự</p>
              <p className="text-4xl font-black text-amber-600 tracking-tighter leading-none mt-1">{data?.guides?.length || 0}</p>
            </div>
          </div>
          <div className="p-10 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="pb-8">Thông tin cá nhân</th>
                  <th className="pb-8 text-center px-10">Tần suất dẫn tour</th>
                  <th className="pb-8 pl-10">Danh sách Tour đã & đang đảm nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.guides?.length > 0 ? data.guides.map((guide: any) => (
                  <tr key={guide.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-8">
                      <p className="font-black text-slate-800 text-sm italic group-hover:text-amber-600 transition-colors uppercase tracking-tight">{guide.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic mt-1">{guide.email}</p>
                    </td>
                    <td className="py-8 text-center px-10">
                      <span className="bg-amber-50 border border-amber-100 text-amber-600 text-3xl px-8 py-3 rounded-2xl font-black shadow-inner">
                        {guide.total_tours}
                      </span>
                    </td>
                    <td className="py-8 pl-10 text-sm text-slate-600 max-w-lg">
                      <div className="flex flex-wrap gap-2">
                        {guide.tours?.map((t:any, idx:number) => (
                          <span 
                            key={idx} 
                            onClick={() => handleOpenRevenueModal(t)}
                            className="bg-white border-2 border-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 shadow-sm hover:border-amber-400 hover:text-amber-600 transition-all cursor-pointer uppercase tracking-tighter italic"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="py-20 text-center text-slate-400 italic font-black text-lg">Hệ thống chưa ghi nhận hoạt động từ HDV</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT DOANH THU & HOA HỒNG (Dành cho Admin) */}
      {modalOpen && selectedTour && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl relative border border-white/20">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-black text-3xl font-light transition-colors"
            >
              ×
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase italic tracking-tighter">Báo cáo tài chính Tour</h2>
            <p className="text-xs text-slate-500 font-bold mb-10 uppercase tracking-widest italic border-b border-slate-100 pb-4">
              Tour: <span className="text-amber-600">{selectedTour.name}</span>
            </p>

            {!revenueData ? (
              <div className="py-12 text-center animate-pulse text-amber-600 font-black italic uppercase tracking-widest text-xs">Đang phân tích  dữ liệu tài chính...</div>
            ) : (
              <div className="space-y-8">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                  <div className="absolute right-[-10%] top-[-10%] w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tổng doanh thu Tour</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">{(revenueData.total_revenue || 0).toLocaleString()}đ</p>
                  <div className="mt-4 text-[10px] font-bold text-emerald-600 uppercase">
                    Thành công từ {revenueData.total_bookings} đơn hàng
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                     <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">Hoa hồng HDV (10%)</p>
                     <p className="text-2xl font-black text-amber-700">{(revenueData.guide_commission || 0).toLocaleString()}đ</p>
                   </div>
                   <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 text-right">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Tiền trả NCC (85%)</p>
                     <p className="text-xl font-black text-indigo-700">{(revenueData.supplier_revenue || 0).toLocaleString()}đ</p>
                   </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => setModalOpen(false)}
              className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl"
            >
              Đóng báo cáo chi tiết
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
