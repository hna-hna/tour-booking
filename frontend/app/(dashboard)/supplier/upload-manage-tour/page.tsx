"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
export default function UploadManageTourPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [guides, setGuides] = useState<any[]>([]);
  
  const [statusFilter, setStatusFilter] = useState("all");
  // ---------------------------

  // Modal assign lại guide
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<any>(null);
  const [selectedGuideId, setSelectedGuideId] = useState("");

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    image_file: null as File | null,
    image_url: "",
    price: "",
    quantity: "",
    guide_id: "",
    itinerary: "",
    description: "",
    start_date: "",
    end_date: ""
  });

  // 1. Lấy danh sách tour (Cập nhật: Có kèm tham số lọc)
  const fetchTours = async () => {
    try {
      setLoading(true);
      
      // --- CẬP NHẬT LOGIC URL ---
      // Tạo URL với tham số status nếu Supplier chọn lọc
      let url = `http://127.0.0.1:5000/api/supplier/tours?nocache=${Date.now()}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      // ----------------------------

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (res.status === 401) {
        alert("Phiên làm việc hết hạn!");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        alert("Lỗi tải danh sách: " + (data.error || data.msg || JSON.stringify(data)));
      }
      setTours(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải tour:", err);
      alert("Lỗi tải tour từ server!");
    } finally {
      setLoading(false);
    }
  };

  // 2. Lấy danh sách HDV 
  const fetchGuides = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/supplier/guides", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.guides || []);
      setGuides(list);
    } catch (e) {
      console.error("Lỗi tải HDV:", e);
    }
  };

  // Cập nhật Effect: Gọi lại API khi thay đổi trạng thái lọc
  useEffect(() => {
    fetchTours();
    fetchGuides();
  }, [statusFilter]); 

  // 3. Mở modal (Giữ nguyên)
  const handleOpenModal = (tour: any = null) => {
    if (tour) {
      setFormData({
        ...tour,
        image_file: null,
        image_url: tour.image || "",
        price: tour.price ? tour.price.toString() : "",
        quantity: tour.quantity ? tour.quantity.toString() : "",
        guide_id: tour.guide_id ? tour.guide_id.toString() : "",
        itinerary: tour.itinerary || "",
        description: tour.description || "",
        start_date: tour.start_date ? tour.start_date.substring(0, 10) : "",
        end_date: tour.end_date ? tour.end_date.substring(0, 10) : ""
      });
    } else {
      setFormData({
        id: null,
        name: "",
        image_file: null,
        image_url: "",
        price: "",
        quantity: "",
        guide_id: "",
        itinerary: "",
        description: "",
        start_date: "",
        end_date: ""
      });
    }
    setIsModalOpen(true);
  };
  // 4. Upload ảnh lên Supabase
  const uploadImageToSupabase = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('tours')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('tours')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Lỗi upload Supabase:", error);
      alert("Không thể upload ảnh! Hãy kiểm tra lại Bucket trên Supabase.");
      return null;
    }
  };

  // 5. Submit form 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalImageUrl = formData.image_url;

    if (formData.image_file) {
      const newUrl = await uploadImageToSupabase(formData.image_file);
      if (!newUrl) {
        setUploading(false);
        return;
      }
      finalImageUrl = newUrl;
    }

    const payload = {
      name: formData.name,
      price: Number(formData.price),
      quantity: Number(formData.quantity) || 20,
      itinerary: formData.itinerary || "",
      description: formData.description || "",
      guide_id: formData.guide_id ? Number(formData.guide_id) : null,
      image: finalImageUrl,
      start_date: formData.start_date,
      end_date: formData.end_date
    };

    const isUpdate = !!formData.id;
    const url = isUpdate
      ? `http://127.0.0.1:5000/api/supplier/tours/${formData.id}`
      : "http://127.0.0.1:5000/api/supplier/tours";

    try {
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(isUpdate ? "Cập nhật thành công!" : "Đã tạo tour thành công!");
        setIsModalOpen(false);
        fetchTours();
      } else {
        const errorData = await res.json();
        alert("Lỗi từ Server: " + (errorData.error || errorData.msg || "Không xác định"));
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Lỗi kết nối Server!");
    } finally {
      setUploading(false);
    }
  };

  // 6. Xóa tour 
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tour này?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/supplier/tours/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        alert("Đã xóa tour thành công!");
        fetchTours();
      } else {
        alert("Lỗi khi xóa tour");
      }
    } catch (e) {
      alert("Lỗi kết nối mạng");
    }
  };

  const handleRequestCancel = async (id: number) => {
    if (!confirm("Gửi yêu cầu hủy tour này đến Admin?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/supplier/tours/${id}/request-cancel`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        alert("Đã gửi yêu cầu hủy!");
        fetchTours(); // Load lại danh sách
      } else {
        const err = await res.json();
        alert(err.msg || "Lỗi khi gửi yêu cầu");
      }
    } catch (e) { alert("Lỗi kết nối"); }
  };

  // 7. Mở modal assign lại guide
  const handleOpenAssignModal = (tour: any) => {
    setSelectedTour(tour);
    setSelectedGuideId("");
    setAssignModalOpen(true);
  };

  // 8. Gửi assign lại guide 
  const handleAssignGuide = async () => {
    if (!selectedGuideId) {
      alert("Vui lòng chọn HDV!");
      return;
    }
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/supplier/tours/${selectedTour.id}/assign-guide`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ guide_id: Number(selectedGuideId) })
        }
      );

      if (res.ok) {
        alert("Đã gửi yêu cầu cho HDV mới!");
        setAssignModalOpen(false);
        fetchTours();
      } else {
        const err = await res.json();
        alert("Lỗi: " + (err.msg || "Không xác định"));
      }
    } catch (e) {
      alert("Lỗi kết nối mạng");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white min-h-screen rounded-3xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
            Quản lý & Đăng tải Tour
          </h1>
          <p className="text-gray-400 text-sm">Quản lý lịch trình, HDV và giá tour của bạn</p>
          
          {/* --- PHẦN MỚI THÊM VÀO --- */}
          <div className="flex gap-4 mt-6">
            {[
              { id: "all", label: "TẤT CẢ" },
              { id: "approved", label: "ĐÃ DUYỆT" },
              { id: "rejected", label: "BỊ TỪ CHỐI" },
              { id: "pending", label: "ĐANG CHỜ" }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Đăng Tour mới
        </button>
      </div>

      {/* DANH SÁCH TOUR */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 italic">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tours.map((t) => (
            <div
              key={t.id || Math.random()}
              className={`group bg-gray-50 hover:bg-white border hover:border-emerald-200 p-6 rounded-3xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${t.needs_guide ? "border-red-200 bg-red-50/30" : ""
                }`}
            >
              {/* Thumbnail */}
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                {t.image ? (
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* Status badge */}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${t.status === 'approved' ? 'bg-green-100 text-green-600' :
                    t.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                    {t.status ? t.status.toUpperCase() : "CHỜ DUYỆT"}
                  </span>



                  {t.status === 'rejected' && t.reject_reason && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                      Lý do: {t.reject_reason}
                    </span>
                  )}

                  <span className="text-xs font-bold text-gray-500 uppercase">ID: #{t.id}</span>
                </div>

                <h3 className="text-lg font-black text-gray-800 group-hover:text-emerald-700 transition-colors">
                  {t.name}
                </h3>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                  <p className="text-sm text-gray-500 font-medium">
                    <span className="text-gray-800">{t.price?.toLocaleString() || 0}đ</span>
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    HDV: <span className={`${t.needs_guide ? "text-red-500 font-bold" : "text-gray-800"}`}>
                      {t.guide_name || "Chưa phân công"}
                    </span>
                  </p>
                  {t.start_date && (
                    <p className="text-sm text-gray-500 font-medium">
                      Ngày <span className="text-gray-800">
                        {new Date(t.start_date).toLocaleDateString("vi-VN")}
                        {t.end_date && ` → ${new Date(t.end_date).toLocaleDateString("vi-VN")}`}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                {t.needs_guide && (
                  <button
                    onClick={() => handleOpenAssignModal(t)}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-600 transition-all shadow-md"
                  >
                    🔄 Chọn HDV mới
                  </button>
                )}





                {/* 2. NÚT YÊU CẦU HỦY: Hiện khi tour đã approved */}
                {t.status === 'approved' && (
                  <button
                    onClick={() => handleRequestCancel(t.id)}
                    className="bg-amber-100 text-amber-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-amber-600 hover:text-white transition-all border border-amber-200"
                  >
                     YÊU CẦU HỦY
                  </button>
                )}

                {/* 3. NÚT SỬA/XÓA: Hiện khi tour chưa duyệt hoặc bị từ chối */}
                {['pending', 'rejected', 'pending_guide', 'waiting_guide'].includes(t.status) && (
                  <>
                    <button
                      onClick={() => handleOpenModal(t)}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all"
                    >
                      SỬA
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all"
                    >
                      XÓA
                    </button>
                  </>
                )}

                {/* 4. THÔNG BÁO khi đang chờ Admin duyệt hủy */}
                {t.status === 'cancel_requested' && (
                  <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl italic text-[11px] font-bold border border-dashed border-gray-300">
                    ⏳ Đang chờ Admin duyệt hủy...
                  </span>
                )}
              </div>
            </div>
          ))}

          {tours.length === 0 && !loading && (
            <div className="text-center py-20 text-gray-400 italic">Chưa có tour nào</div>
          )}
        </div>
      )}

      {/* MODAL ASSIGN LẠI HDV */}
      {assignModalOpen && selectedTour && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-black text-gray-800 mb-2">Chọn HDV mới</h2>
            <p className="text-sm text-gray-500 mb-6">
              Tour: <span className="font-bold text-gray-800">{selectedTour.name}</span>
            </p>

            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
              Chọn Hướng Dẫn Viên
            </label>
            <select
              className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold text-gray-700 mb-6"
              value={selectedGuideId}
              onChange={e => setSelectedGuideId(e.target.value)}
            >
              <option value="">-- Chọn HDV --</option>
              {guides
                .filter(g => g.status && g.status.toUpperCase() === 'AVAILABLE')
                .map(g => (
                  <option key={g.id} value={g.id}>{g.full_name}</option>
                ))}
            </select>

            <div className="flex gap-4">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleAssignGuide}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM TẠO/SỬA TOUR  */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-800 uppercase italic">
                {formData.id ? "Cập nhật Tour" : "Đăng ký Tour mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black text-2xl">×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tên Tour</label>
                <input
                  required
                  className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Hình ảnh</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-gray-50 p-4 rounded-2xl"
                  onChange={e => {
                    if (e.target.files?.[0]) setFormData({ ...formData, image_file: e.target.files[0] });
                  }}
                />
                {formData.image_url && !formData.image_file && (
                  <p className="text-xs text-green-600 mt-2">✓ Đang dùng ảnh cũ</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Giá (VNĐ)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Số lượng khách</label>
                <input
                  type="number"
                  required
                  className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ngày bắt đầu</label>
                <input
                  type="date"
                  required
                  className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ngày kết thúc</label>
                <input
                  type="date"
                  required
                  className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Chọn Hướng Dẫn Viên (Đang sẵn sàng)
                </label>
                <select
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold text-gray-700"
                  value={formData.guide_id || ""}
                  onChange={e => setFormData({ ...formData, guide_id: e.target.value })}
                >
                  <option value="">-- Chưa phân công --</option>
                  {guides
                    .filter(g =>
                      (g.status && g.status.toLowerCase() === 'available')
                      || g.id === Number(formData.guide_id)
                    )
                    .map(g => (
                      <option key={g.id} value={g.id}>{g.full_name}</option>
                    ))}
                </select>
              </div>

              {/* Tách riêng Description & Itinerary nhưng giữ Class CSS cực đẹp của bạn */}
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Mô tả tổng quan</label>
                <textarea
                  rows={3}
                  className="w-full bg-gray-50 p-4 rounded-2xl font-medium text-sm outline-none focus:ring-2 ring-emerald-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Lịch trình chi tiết</label>
                <textarea
                  rows={5}
                  className="w-full bg-gray-50 p-4 rounded-2xl font-medium text-sm outline-none focus:ring-2 ring-emerald-500"
                  value={formData.itinerary}
                  onChange={e => setFormData({ ...formData, itinerary: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-bold uppercase text-xs">
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading}
                className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-tighter hover:bg-gray-800 transition-all shadow-xl disabled:bg-gray-400"
              >
                {uploading ? "Đang xử lý..." : (formData.id ? "Lưu thay đổi" : "Gửi tour")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}