"use client";
import React, { useEffect, useState } from 'react';

export default function RoleStatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/admin/role-stats");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center font-bold text-emerald-600 animate-pulse">Đang truy xuất dữ liệu thống kê...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 print:p-0 print:m-0 print:w-full print:max-w-none">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; padding: 0; }
          .no-print { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
        }
      `}} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6 print:border-b-2 print:border-black">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Thống kê</h1>
          <p className="text-slate-500 font-bold italic mt-2 text-sm">Báo cáo hiệu suất theo từng vai trò (Khách hàng, Nhà cung cấp, Hướng dẫn viên)</p>
        </div>
        <button onClick={handlePrint} className="no-print bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-slate-800 transition-all font-black text-sm tracking-widest flex items-center gap-2">
          Xuất báo cáo
        </button>
      </div>

      <div className="space-y-12">
        
        {/* Customer Section */}
        <div className="print-break-inside-avoid bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
          <div className="bg-emerald-50/50 p-6 border-b border-slate-100 print:bg-emerald-50">
            <h2 className="text-xl font-black text-emerald-800 flex items-center gap-3">
              <span className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">C</span>
              Khách hàng (Customers)
            </h2>
            <p className="text-sm text-emerald-600/80 mt-1 font-medium">Hoạt động đặt tour và chi tiêu trên hệ thống</p>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4">Họ tên & Email</th>
                  <th className="pb-4 text-center">Số chuyến book</th>
                  <th className="pb-4 text-right px-4">Tổng chi tiêu</th>
                  <th className="pb-4 pl-4">Danh sách Tour đã đặt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.customers?.length > 0 ? data.customers.map((cus: any) => (
                  <tr key={cus.id}>
                    <td className="py-4">
                      <p className="font-bold text-slate-800">{cus.name}</p>
                      <p className="text-[10px] text-slate-400">{cus.email}</p>
                    </td>
                    <td className="py-4 text-center font-black text-slate-600">{cus.total_tours}</td>
                    <td className="py-4 text-right px-4 font-black text-emerald-600">{cus.total_spent.toLocaleString()}đ</td>
                    <td className="py-4 pl-4 text-sm text-slate-600 max-w-sm">
                      <div className="flex flex-wrap gap-2">
                        {cus.tours?.map((t:string, idx:number) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-1 flex-shrink-0 rounded-md text-[10px] font-bold">{t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )) : (<tr><td colSpan={4} className="py-8 text-center text-slate-400 italic font-bold">Chưa có dữ liệu giao dịch</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Section */}
        <div className="print-break-inside-avoid bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
          <div className="bg-indigo-50/50 p-6 border-b border-slate-100 print:bg-indigo-50">
            <h2 className="text-xl font-black text-indigo-800 flex items-center gap-3">
              <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">S</span>
              Nhà cung cấp (Suppliers)
            </h2>
            <p className="text-sm text-indigo-600/80 mt-1 font-medium">Lượng tour xuất bản trên nền tảng</p>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4">Đơn vị / Tên</th>
                  <th className="pb-4 text-center px-4">Số lượng Tour</th>
                  <th className="pb-4 pl-4">Danh sách Tour đăng tải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.suppliers?.length > 0 ? data.suppliers.map((sup: any) => (
                  <tr key={sup.id}>
                    <td className="py-4">
                      <p className="font-bold text-slate-800">{sup.name}</p>
                      <p className="text-[10px] text-slate-400">{sup.email}</p>
                    </td>
                    <td className="py-4 text-center px-4 font-black text-indigo-600 text-lg">{sup.total_tours}</td>
                    <td className="py-4 pl-4 text-sm text-slate-600 max-w-lg">
                      <div className="flex flex-wrap gap-2">
                        {sup.tours?.map((t:string, idx:number) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-1 flex-shrink-0 rounded-md text-[10px] font-bold">{t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )) : (<tr><td colSpan={3} className="py-8 text-center text-slate-400 italic font-bold">Chưa có nhà cung cấp đăng tour</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guide Section */}
        <div className="print-break-inside-avoid bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
          <div className="bg-amber-50/50 p-6 border-b border-slate-100 print:bg-amber-50">
            <h2 className="text-xl font-black text-amber-800 flex items-center gap-3">
              <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">G</span>
              Hướng dẫn viên (Guides)
            </h2>
            <p className="text-sm text-amber-700/80 mt-1 font-medium">Thống kê tần suất dẫn tour và khối lượng công việc</p>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4">Hướng dẫn viên</th>
                  <th className="pb-4 text-center px-4">Số Tour đảm nhận</th>
                  <th className="pb-4 pl-4">Danh sách Tour được phân công</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.guides?.length > 0 ? data.guides.map((guide: any) => (
                  <tr key={guide.id}>
                    <td className="py-4">
                      <p className="font-bold text-slate-800">{guide.name}</p>
                      <p className="text-[10px] text-slate-400">{guide.email}</p>
                    </td>
                    <td className="py-4 text-center px-4 font-black text-amber-600 text-lg">{guide.total_tours}</td>
                    <td className="py-4 pl-4 text-sm text-slate-600 max-w-lg">
                      <div className="flex flex-wrap gap-2">
                        {guide.tours?.map((t:string, idx:number) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-1 flex-shrink-0 rounded-md text-[10px] font-bold">{t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )) : (<tr><td colSpan={3} className="py-8 text-center text-slate-400 italic font-bold">Chưa HDV nào nhận tour</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
