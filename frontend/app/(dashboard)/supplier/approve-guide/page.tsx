"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface PendingGuide {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export default function ApproveGuidePage() {
  const router = useRouter();
  const [guides, setGuides] = useState<PendingGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchGuides = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await axios.get("http://127.0.0.1:5000/api/supplier/pending-guides", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuides(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [router]);

  const handleApprove = async (userId: number) => {
    setApproving(userId);
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      await axios.post(`http://127.0.0.1:5000/api/supplier/approve-guide/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage({ text: "Đã duyệt hướng dẫn viên thành công!", type: "success" });
      // Xóa guide vừa duyệt khỏi danh sách hiển thị
      setGuides(guides.filter(g => g.user_id !== userId));
    } catch (err: any) {
      setMessage({ text: err.response?.data?.msg || err.response?.data?.error || "Có lỗi xảy ra", type: "error" });
    } finally {
      setApproving(null);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Duyệt Hướng dẫn viên</h1>
        <button 
          onClick={fetchGuides}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium flex items-center gap-2"
        >
          <span>Làm mới</span>
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
            : 'bg-rose-50 text-rose-700 border-rose-100' 
        }`}>
          <span className="text-2xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {guides.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👥</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Không có hướng dẫn viên chờ duyệt</h3>
          <p className="text-gray-500">Hiện tại không có thành viên mới nào đăng ký tham gia làm Hướng dẫn viên tự do.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-100">
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Họ tên</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Liên hệ</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider">Tình trạng</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guides.map((guide) => (
                  <tr key={guide.user_id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{guide.full_name}</div>
                      <div className="text-xs text-slate-400 mt-1">Gia nhập: {guide.created_at ? new Date(guide.created_at).toLocaleDateString('vi-VN') : 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-600">{guide.email}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{guide.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {guide.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        title="Duyệt nhân viên"
                        disabled={approving === guide.user_id}
                        onClick={() => handleApprove(guide.user_id)}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all
                          ${approving === guide.user_id 
                            ? 'bg-emerald-400 text-white cursor-not-allowed opacity-70' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-md hover:-translate-y-0.5'
                          }`}
                      >
                        {approving === guide.user_id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                            <span>Xử lý...</span>
                          </>
                        ) : (
                          <>
                            <span>Duyệt</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
