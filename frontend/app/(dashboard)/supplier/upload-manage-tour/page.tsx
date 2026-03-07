"use client";
import React, { useEffect, useState } from "react";
// Đảm bảo đường dẫn này đúng với nơi bạn tạo file ở Việc 1
import { supabase } from "../../../../lib/supabaseClient";

export default function UploadManageTourPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); // Thêm trạng thái upload
  const [guides, setGuides] = useState<any[]>([]);

  // State quản lý Form
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    image_file: null as File | null, // Lưu file gốc để upload
    image_url: "", // Lưu link ảnh cũ (nếu có)
    price: "",
    quantity: "",
    guide_id: "",
    itinerary: "",
    description: ""
  });

  // 1. Lấy danh sách tour
  const fetchTours = async () => {
    try {
      setLoading(true);
      // Thêm ?nocache để tránh việc trình duyệt lưu cache cũ
      // Dùng 127.0.0.1 để tránh lỗi trên Windows
      const res = await fetch(`http://127.0.0.1:5000/api/supplier/tours?nocache=${Date.now()}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (res.status === 401) {
        alert("Phiên làm việc hết hạn!");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      setTours(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải tour:", err);
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm tải danh sách HDV
  const fetchGuides = async () => {
    try {
        console.log("Đang tải danh sách HDV...");
        const res = await fetch("http://127.0.0.1:5000/api/supplier/guides", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        console.log("Dữ liệu HDV nhận được:", data);
        
        // Xử lý nếu data trả về dạng { guides: [...] } hoặc trực tiếp [...]
        const list = Array.isArray(data) ? data : (data.guides || []);
        setGuides(list);
    } catch (e) {
        console.error("Lỗi tải HDV:", e);
    }
  };

  useEffect(() => { 
      fetchTours();
      fetchGuides(); 
  }, []);

  // 2. Mở modal (Reset form hoặc điền dữ liệu cũ)
  const handleOpenModal = (tour: any = null) => {
    if (tour) {
      setFormData({
        ...tour,
        image_file: null, // Reset file mới
        image_url: tour.image || "", // Lưu link ảnh hiện tại
        price: tour.price ? tour.price.toString() : "",
        quantity: tour.quantity ? tour.quantity.toString() : "",
        // Đảm bảo guide_id là chuỗi để bind vào select, hoặc rỗng
        guide_id: tour.guide_id ? tour.guide_id.toString() : "" 
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
        description: ""
      });
    }
    setIsModalOpen(true);
  };

  // 3. HÀM UPLOAD ẢNH LÊN SUPABASE (MỚI)
  const uploadImageToSupabase = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload vào bucket tên 'tours' (Bạn phải tạo bucket này trên Supabase rồi nhé)
      const { error: uploadError } = await supabase.storage
        .from('tours')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Lấy link ảnh public
      const { data } = supabase.storage
        .from('tours')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Lỗi upload Supabase:", error);
      alert("Không thể upload ảnh! Hãy kiểm tra lại Bucket trên Supabase.");
      return null;
    }
  };

  // 4. HÀM SUBMIT (Đã sửa sang JSON + Upload ảnh)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true); // Bật loading

    // BƯỚC 1: Xử lý ảnh
    let finalImageUrl = formData.image_url; // Mặc định dùng ảnh cũ

    // Nếu người dùng chọn ảnh mới -> Upload lên Supabase
    if (formData.image_file) {
      const newUrl = await uploadImageToSupabase(formData.image_file);
      if (!newUrl) {
        setUploading(false);
        return; // Dừng nếu upload lỗi
      }
      finalImageUrl = newUrl;
    }

    // BƯỚC 2: Chuẩn bị dữ liệu JSON
    const payload = {
      name: formData.name,
      price: Number(formData.price),
      quantity: Number(formData.quantity) || 20,
      itinerary: formData.itinerary || "",
      description: formData.description || "",
      guide_id: formData.guide_id ? Number(formData.guide_id) : null,
      image: finalImageUrl // Gửi link ảnh (string)
    };

    const isUpdate = !!formData.id;
    const url = isUpdate
      ? `http://127.0.0.1:5000/api/supplier/tours/${formData.id}`
      : "http://127.0.0.1:5000/api/supplier/tours";

    try {
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json", // QUAN TRỌNG: Backend cần cái này
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload), // Gửi JSON
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

  // 5. Xử lý Xóa
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

  return (
    <div className="p-4 md:p-8 bg-white min-h-screen rounded-3xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
            Quản lý & Đăng tải Tour
          </h1>
          <p className="text-gray-400 text-sm">Quản lý lịch trình, HDV và giá tour của bạn</p>
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
              className="group bg-gray-50 hover:bg-white border hover:border-emerald-200 p-6 rounded-3xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              {/* HIỂN THỊ ẢNH THU NHỎ (THUMBNAIL) */}
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                 {t.image ? (
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                 )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${t.status === 'approved' ? 'bg-green-100 text-green-600' :
                    t.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                    {t.status ? t.status.toUpperCase() : "CHỜ DUYỆT"}
                  </span>
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
                    HDV: <span className="text-gray-800">{t.guide_name || "Chưa phân công"}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto border-t md:border-none pt-4 md:pt-0">
                {(t.status === 'pending' || t.status === 'rejected') ? (
                  <>
                    <button onClick={() => handleOpenModal(t)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all">
                      SỬA
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all">
                      XÓA
                    </button>
                  </>
                ) : (
                   <div className="text-gray-400 italic text-[11px]">Đã duyệt</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
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
                <input required className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Hình ảnh</label>
                <input type="file" accept="image/*" className="w-full bg-gray-50 p-4 rounded-2xl"
                  onChange={e => {
                    if (e.target.files?.[0]) setFormData({ ...formData, image_file: e.target.files[0] });
                  }} />
                {/* Preview ảnh cũ nếu có */}
                {formData.image_url && !formData.image_file && (
                    <p className="text-xs text-green-600 mt-2">✓ Đang dùng ảnh cũ</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Giá (VNĐ)</label>
                <input type="number" required className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500"
                  value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Số lượng khách</label>
                <input type="number" required className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-500"
                  value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
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
                            // Chuyển status về chữ thường để so sánh (không phân biệt hoa thường)
                            (g.status && g.status.toLowerCase() === 'available') 
                            || g.id === Number(formData.guide_id)
                        ) 
                        .map(g => (
                            <option key={g.id} value={g.id}>
                                {g.full_name}  
                            </option>
                        ))}
                </select>
            </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Lịch trình & Mô tả</label>
                <textarea rows={4} className="w-full bg-gray-50 p-4 rounded-2xl font-medium text-sm outline-none focus:ring-2 ring-emerald-500"
                  value={formData.itinerary} onChange={e => setFormData({ ...formData, itinerary: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-gray-400 font-bold uppercase text-xs">Đóng</button>
              <button type="button" onClick={handleSubmit} disabled={uploading}
                className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-tighter hover:bg-gray-800 transition-all shadow-xl disabled:bg-gray-400">
                {uploading ? "Đang xử lý..." : (formData.id ? "Lưu thay đổi" : "Gửi tour")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}