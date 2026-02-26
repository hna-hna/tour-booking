"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  UserCircle2, 
  Phone, 
  Mail, 
  Languages, 
  Award, 
  Calendar,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";

// 1. Cập nhật Type
interface TourGuide {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  license_number?: string;
  years_of_experience: number;
  languages?: string;
  specialties?: string;
  status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE'; // Đã sửa thành IN HOA
}

export default function TourGuideManagementPage() {
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TourGuide>>({
    full_name: "",
    phone: "",
    email: "",
    license_number: "",
    years_of_experience: 0,
    languages: "",
    specialties: "",
    status: 'AVAILABLE' // Đã sửa
  });

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/supplier/guides", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setGuides(res.data);
    } catch (error) {
      console.error("Lỗi tải HDV:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleOpenModal = (guide?: TourGuide) => {
    if (guide) {
      setFormData(guide);
    } else {
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        license_number: "",
        years_of_experience: 0,
        languages: "",
        specialties: "",
        status: 'AVAILABLE' // Đã sửa
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUpdate = !!formData.id;

    try {
      const url = isUpdate
        ? `http://127.0.0.1:5000/api/supplier/guides/${formData.id}`
        : "http://127.0.0.1:5000/api/supplier/guides";

      await axios({
        method: isUpdate ? "PUT" : "POST",
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        data: formData
      });

      alert(isUpdate ? "Cập nhật thành công!" : "Thêm HDV thành công!");
      setIsModalOpen(false);
      fetchGuides();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.error || "Không thể kết nối"));
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await axios.patch(
        `http://127.0.0.1:5000/api/supplier/guides/${id}/status`,
        { status }, // Sẽ gửi giá trị IN HOA từ nút bấm
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      fetchGuides();
    } catch (error) {
      alert("Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa HDV này?")) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/api/supplier/guides/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchGuides();
    } catch (error) {
      alert("Không thể xóa HDV");
    }
  };

  // 2. Cập nhật config Map sang IN HOA
  const getStatusConfig = (status: string) => {
    const configs = {
      AVAILABLE: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        label: "Sẵn sàng",
        icon: CheckCircle2
      },
      BUSY: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        dot: "bg-amber-500",
        label: "Đang bận",
        icon: Clock
      },
      ON_LEAVE: {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-700",
        dot: "bg-slate-400",
        label: "Nghỉ phép",
        icon: XCircle
      }
    };
    return configs[status as keyof typeof configs] || configs.AVAILABLE;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // 3. Cập nhật lọc thống kê
  const stats = {
    AVAILABLE: guides.filter(g => g.status === 'AVAILABLE').length,
    BUSY: guides.filter(g => g.status === 'BUSY').length,
    ON_LEAVE: guides.filter(g => g.status === 'ON_LEAVE').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-2">
                Đội ngũ Hướng dẫn viên
              </h1>
              <p className="text-slate-500 flex items-center gap-2">
                <UserCircle2 className="w-4 h-4" />
                Quản lý và phân công lịch làm việc HDV
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Thêm HDV mới
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle2 className="w-8 h-8 opacity-80" />
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                {stats.AVAILABLE}
              </span>
            </div>
            <h3 className="text-2xl font-black mb-1">{stats.AVAILABLE} HDV</h3>
            <p className="text-emerald-100 text-sm">Sẵn sàng làm việc</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                {stats.BUSY}
              </span>
            </div>
            <h3 className="text-2xl font-black mb-1">{stats.BUSY} HDV</h3>
            <p className="text-amber-100 text-sm">Đang bận lịch</p>
          </div>

          <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-3xl p-6 text-white shadow-xl shadow-slate-500/20">
            <div className="flex items-center justify-between mb-3">
              <XCircle className="w-8 h-8 opacity-80" />
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
                {stats.ON_LEAVE}
              </span>
            </div>
            <h3 className="text-2xl font-black mb-1">{stats.ON_LEAVE} HDV</h3>
            <p className="text-slate-100 text-sm">Đang nghỉ phép</p>
          </div>
        </div>

        {/* Guide Cards */}
        {guides.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center shadow-lg border border-slate-100">
            <UserCircle2 className="w-20 h-20 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có hướng dẫn viên</h3>
            <p className="text-slate-500">Bắt đầu bằng cách thêm HDV đầu tiên của bạn</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => {
              const statusConfig = getStatusConfig(guide.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={guide.id}
                  className="group bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Header with Avatar */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-black text-white">
                          {guide.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${statusConfig.dot} rounded-full border-4 border-white`}></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 text-lg mb-1 truncate">
                        {guide.full_name}
                      </h3>
                      <div className={`inline-flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.border} border px-3 py-1 rounded-full`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.text}`} />
                        <span className={`text-xs font-bold ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-slate-600 truncate">{guide.phone || "Chưa cập nhật"}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-slate-600 truncate">{guide.email || "Chưa cập nhật"}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Languages className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-slate-600 truncate">{guide.languages || "Chưa cập nhật"}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-slate-600 font-semibold">
                        {guide.years_of_experience} năm kinh nghiệm
                      </span>
                    </div>

                    {guide.license_number && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-slate-600 font-mono text-xs">{guide.license_number}</span>
                      </div>
                    )}
                  </div>

                  {/* 4. Cập nhật Status Quick Actions sang IN HOA */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      onClick={() => handleStatusChange(guide.id, 'AVAILABLE')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all ${
                        guide.status === 'AVAILABLE'
                          ? 'bg-emerald-500 text-white shadow-lg scale-105'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      Sẵn sàng
                    </button>
                    <button
                      onClick={() => handleStatusChange(guide.id, 'BUSY')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all ${
                        guide.status === 'BUSY'
                          ? 'bg-amber-500 text-white shadow-lg scale-105'
                          : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      }`}
                    >
                      Bận
                    </button>
                    <button
                      onClick={() => handleStatusChange(guide.id, 'ON_LEAVE')}
                      className={`px-2 py-2 rounded-xl text-xs font-bold transition-all ${
                        guide.status === 'ON_LEAVE'
                          ? 'bg-slate-500 text-white shadow-lg scale-105'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Nghỉ
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleDelete(guide.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all group-hover:shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa HDV
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Form giữ nguyên các logic xử lý khác */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <UserCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {formData.id ? "Cập nhật thông tin HDV" : "Thêm HDV mới"}
                  </h2>
                  <p className="text-sm text-slate-500">Điền đầy đủ thông tin bên dưới</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ... Các field khác giữ nguyên ... */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder=""
                    value={formData.full_name || ""}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số điện thoại</label>
                    <input
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder=""
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder=""
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số thẻ HDV</label>
                    <input
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder=""
                      value={formData.license_number || ""}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số năm kinh nghiệm</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      value={formData.years_of_experience || 0}
                      onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ngôn ngữ</label>
                  <input
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder=""
                    value={formData.languages || ""}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Chuyên môn / Kỹ năng</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                    placeholder=""
                    value={formData.specialties || ""}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3.5 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-bold transition-all hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all hover:scale-105"
                  >
                    {formData.id ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}