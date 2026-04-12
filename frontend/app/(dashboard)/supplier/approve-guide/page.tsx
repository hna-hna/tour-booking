"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface PendingGuide {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export default function ApproveGuidePage() {
  const router = useRouter();
  const [guides, setGuides] = useState<PendingGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const fetchGuides = async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      const res = await axios.get("http://127.0.0.1:5000/api/supplier/pending-guides", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuides(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuides(); }, [router]);

  const handleApprove = async (userId: string) => {
    setApproving(userId);
    const token = localStorage.getItem("token");
    try {
      await axios.post(`http://127.0.0.1:5000/api/supplier/approve-guide/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: "Đã duyệt nhân sự vào công ty thành công!", type: "success" });
      setGuides(guides.filter(g => g.user_id !== userId));
    } catch (err: any) {
      setMessage({ text: "Lỗi khi duyệt hồ sơ.", type: "error" });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối hướng dẫn viên này?")) return;
    setApproving(userId);
    const token = localStorage.getItem("token");
    try {
      await axios.post(`http://127.0.0.1:5000/api/supplier/reject-guide/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ text: "Đã từ chối nhân sự vào công ty!", type: "success" });
      setGuides(guides.filter(g => g.user_id !== userId));
    } catch (err: any) {
      setMessage({ text: "Lỗi khi từ chối hồ sơ.", type: "error" });
    } finally {
      setApproving(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-t-slate-800 rounded-full animate-spin"></div></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-gray-800 uppercase italic">Duyệt Hướng dẫn viên gia nhập</h1>
        <button onClick={fetchGuides} className="bg-slate-100 px-6 py-2 rounded-xl font-bold text-sm">Làm mới danh sách</button>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-2xl border font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
          {message.text}
        </div>
      )}

      {guides.length === 0 ? (
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-100 p-20 text-center">
          <p className="text-gray-400 font-bold italic uppercase tracking-widest text-sm">Hiện không có yêu cầu gia nhập nào trong 30 phút qua</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-50 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900 text-white text-[10px] uppercase tracking-[0.2em]">
                <th className="px-8 py-5">Thông tin nhân sự</th>
                <th className="px-8 py-5">Liên hệ</th>
                <th className="px-8 py-5">Thời gian yêu cầu</th>
                <th className="px-8 py-5 text-right">Quyết định</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {guides.map((guide) => (
                <tr key={guide.user_id} className="hover:bg-slate-50 transition-all">
                  <td className="px-8 py-6 font-black text-gray-800 text-lg">{guide.full_name}</td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-gray-600 text-sm">{guide.email}</p>
                    <p className="text-xs text-gray-400">{guide.phone}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                        {new Date(guide.created_at).toLocaleTimeString('vi-VN')}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right space-x-3 flex justify-end">
                    <button
                      disabled={approving === guide.user_id}
                      onClick={() => handleReject(guide.user_id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      Từ chối
                    </button>
                    <button
                      disabled={approving === guide.user_id}
                      onClick={() => handleApprove(guide.user_id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-100"
                    >
                      {approving === guide.user_id ? "Đang xử lý..." : "Chấp nhận"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}