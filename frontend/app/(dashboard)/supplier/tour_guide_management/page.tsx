"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface TourGuide {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  license_number?: string;
  years_of_experience: number;
  languages?: string;
  specialties?: string;
  status: 'available' | 'busy' | 'on_leave';
 
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
    status: 'available'
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
        status: 'available'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUpdate = !!formData.id;

    try {
      const url = isUpdate
        ? `http://localhost:5000/api/supplier/guides/${formData.id}`
        : "http://localhost:5000/api/supplier/guides";

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
        `http://localhost:5000/api/supplier/guides/${id}/status`,
        { status },
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
      await axios.delete(`http://localhost:5000/api/supplier/guides/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchGuides();
    } catch (error) {
      alert("Không thể xóa HDV");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      available: "bg-green-100 text-green-700",
      busy: "bg-orange-100 text-orange-700",
      on_leave: "bg-gray-100 text-gray-700"
    };
    const labels = {
      available: "Trống lịch",
      busy: "Bận lịch",
      on_leave: "Tạm nghỉ"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Quản lý Hướng dẫn viên</h1>
          <p className="text-gray-500 mt-2">Quản lý đội ngũ HDV và lịch làm việc</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition"
        >
          + Thêm HDV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <p className="text-green-600 text-sm font-semibold">Trống lịch</p>
          <p className="text-3xl font-black text-green-700 mt-2">
            {guides.filter(g => g.status === 'available').length}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <p className="text-orange-600 text-sm font-semibold">Bận lịch</p>
          <p className="text-3xl font-black text-orange-700 mt-2">
            {guides.filter(g => g.status === 'busy').length}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <p className="text-gray-600 text-sm font-semibold">Tạm nghỉ</p>
          <p className="text-3xl font-black text-gray-700 mt-2">
            {guides.filter(g => g.status === 'on_leave').length}
          </p>
        </div>
      </div>

      {/* Guide List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide) => (
          <div key={guide.id} className="bg-white border rounded-2xl p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                
                <div>
                  <h3 className="font-bold text-gray-800">{guide.full_name}</h3>
                  <p className="text-xs text-gray-500">{guide.license_number || "Chưa có số thẻ"}</p>
                </div>
              </div>
              {getStatusBadge(guide.status)}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>📞 {guide.phone || "Chưa cập nhật"}</p>
              <p>✉️ {guide.email || "Chưa cập nhật"}</p>
              <p>🌐 {guide.languages || "Chưa cập nhật"}</p>
              <p>⭐ {guide.years_of_experience} năm kinh nghiệm</p>
            </div>

            {/* Status Quick Actions */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleStatusChange(guide.id, 'available')}
                className="flex-1 px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-lg hover:bg-green-100"
              >
                Trống lịch
              </button>
              <button
                onClick={() => handleStatusChange(guide.id, 'busy')}
                className="flex-1 px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-lg hover:bg-orange-100"
              >
                Bận
              </button>
              <button
                onClick={() => handleStatusChange(guide.id, 'on_leave')}
                className="flex-1 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100"
              >
                Nghỉ
              </button>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => handleOpenModal(guide)}
                className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(guide.id)}
                className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {guides.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <p className="text-gray-400">Chưa có hướng dẫn viên nào</p>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-6">
              {formData.id ? "Cập nhật HDV" : "Thêm HDV mới"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Họ tên *</label>
                <input
                  required
                  className="w-full p-3 border rounded-xl"
                  value={formData.full_name || ""}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Số điện thoại</label>
                  <input
                    className="w-full p-3 border rounded-xl"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full p-3 border rounded-xl"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Số thẻ HDV</label>
                  <input
                    className="w-full p-3 border rounded-xl"
                    value={formData.license_number || ""}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Số năm KN</label>
                  <input
                    type="number"
                    className="w-full p-3 border rounded-xl"
                    value={formData.years_of_experience || 0}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Ngôn ngữ</label>
                <input
                  className="w-full p-3 border rounded-xl"
                  value={formData.languages || ""}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Chuyên môn</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border rounded-xl"
                  value={formData.specialties || ""}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 border rounded-xl font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                {formData.id ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}