// frontend/app/(main)/tours/create/page.tsx
"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupplierCreateTour() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: "", 
        itinerary: "", // Lịch trình chi tiết
        price: "", 
        quantity: ""   // Số lượng
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("http://127.0.0.1:5000/api/tours", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, supplier_id: 1 })
        });
        if (res.ok) {
            alert("Đăng tour thành công! Chờ Admin phê duyệt.");
            router.push("/tours");
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Thêm Tour Du Lịch Mới</h1>
            <form onSubmit={handleCreate} className="space-y-4 bg-white p-6 shadow rounded-xl">
                <input placeholder="Tên Tour" className="w-full border p-3 rounded" 
                    onChange={e => setForm({...form, name: e.target.value})} required />
                
                <textarea placeholder="Lịch trình chi tiết (Ví dụ: Ngày 1: ..., Ngày 2: ...)" 
                    className="w-full border p-3 rounded h-32" 
                    onChange={e => setForm({...form, itinerary: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Giá (VNĐ)" className="border p-3 rounded" 
                        onChange={e => setForm({...form, price: e.target.value})} required />
                    <input type="number" placeholder="Số lượng chỗ" className="border p-3 rounded" 
                        onChange={e => setForm({...form, quantity: e.target.value})} required />
                </div>

                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold">
                    Gửi yêu cầu phê duyệt
                </button>
            </form>
        </div>
    );
}