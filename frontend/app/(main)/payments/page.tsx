"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation"; // Đã import đúng

// --- CẤU HÌNH ---
// Thay bằng Key của bạn
const stripePromise = loadStripe("pk_test_51Szx98359mScY0lGSspDSZzzZ60Hth9U2TTKEZyTO5lALa04gRcUnhx4E6WXt93jKTpm5H3lHGvgNJPg2Savcgh600hYOh3wtr"); 

// --- COMPONENT FORM STRIPE ---
function StripeCheckoutForm({ amount }: { amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  
  // 2. KHAI BÁO ROUTER Ở ĐÂY
  const router = useRouter(); 

  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/payment-success` },
    });

    if (error) {
      // Chuyển hướng sang trang fail nếu có lỗi
      router.push(`/payment-fail?error_message=${encodeURIComponent(error.message || "Lỗi giao dịch")}`);
      return; 
    }
  };

  // PHẦN RETURN JSX NẰM TRONG HÀM StripeCheckoutForm
  return (
    <form onSubmit={handleSubmit} className="mt-4 animate-fade-in">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
        <PaymentElement />
      </div>
      <button disabled={isProcessing || !stripe || !elements} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold uppercase hover:bg-emerald-700 transition-all disabled:bg-gray-300">
        {isProcessing ? "Đang xử lý..." : `Thanh toán ${amount.toLocaleString()}đ`}
      </button>
      {message && <p className="text-red-500 text-sm mt-2 text-center font-bold">{message}</p>}
    </form>
  );
}

// --- COMPONENT CHÍNH ---
function PaymentContent() {
  const searchParams = useSearchParams();
  const tourId = searchParams.get("id");
  const amount = searchParams.get("amount");
  const guests = searchParams.get("guests");
  const date = searchParams.get("date");

  const [tour, setTour] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState("");
  
  // State chọn phương thức thanh toán
  const [method, setMethod] = useState<"vnpay" | "stripe" | "cash">("vnpay");

  // 1. Lấy thông tin Tour
  useEffect(() => {
    if (tourId) {
      axios.get(`http://127.0.0.1:5000/api/tours/${tourId}`)
        .then(res => setTour(res.data))
        .catch(err => console.error(err));
    }
  }, [tourId]);

  // 2. Chỉ gọi Stripe khi người dùng CHỌN "Thẻ tín dụng"
 // Trong file app/(main)/payments/page.tsx

  // 2. Chỉ gọi Stripe khi người dùng CHỌN "Thẻ tín dụng"
  useEffect(() => {
    if (method === "stripe" && amount && !clientSecret) {
      
      // Lấy Token để Backend biết user nào đang mua
      const token = localStorage.getItem("token"); 

      fetch("http://127.0.0.1:5000/create-payment-intent", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // <--- THÊM DÒNG NÀY
        },
        body: JSON.stringify({ 
            amount: Number(amount),
            // Gửi thêm thông tin để lưu Order
            tour_id: tourId,
            guests: guests,
            date: date
        }),
      })
        .then((res) => res.json())
        .then((data) => {
             const secret = data.clientSecret || data.client_secret;
             if(secret) setClientSecret(secret);
             else alert("Lỗi: " + JSON.stringify(data));
        })
        .catch(err => alert("Lỗi server!"));
    }
  }, [method, amount, clientSecret, tourId, guests, date]); // Thêm dependencies

  // Xử lý khi bấm nút "Thanh toán VNPay" (Mockup)
  const handleVNPay = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Vui lòng đăng nhập!");
            return;
        }

        const res = await fetch("http://localhost:5000/create_payment_vnpay", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: Number(amount),
                tour_id: tourId,
                guests: guests,
                date: date
            })
        });

        const data = await res.json();
        if (data.paymentUrl) {
            // Chuyển hướng sang VNPay
            window.location.href = data.paymentUrl;
        } else {
            alert("Lỗi tạo link thanh toán: " + JSON.stringify(data));
        }

    } catch (error) {
        console.error("Lỗi:", error);
        alert("Có lỗi xảy ra khi kết nối tới Server");
    }
};

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* CỘT TRÁI: CHỌN PHƯƠNG THỨC */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 shadow-xl border border-emerald-50">
          <h2 className="text-2xl font-black text-gray-800 uppercase italic mb-6">Chọn cách thanh toán</h2>
          
          <div className="space-y-4">
            {/* Lựa chọn 1: VNPay */}
            <div 
                onClick={() => setMethod("vnpay")}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${method === "vnpay" ? "border-emerald-500 bg-emerald-50" : "border-gray-100 hover:border-emerald-200"}`}
            >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">🏧</div>
                <div className="flex-1">
                    <p className="font-bold text-gray-700">VNPay / ATM Nội địa</p>
                    <p className="text-xs text-gray-400">Quét mã QR hoặc thẻ ngân hàng VN</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === "vnpay" ? "border-emerald-500" : "border-gray-300"}`}>
                    {method === "vnpay" && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>}
                </div>
            </div>

            {/* Lựa chọn 2: Stripe (Visa/Mastercard) */}
            <div 
                onClick={() => setMethod("stripe")}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${method === "stripe" ? "border-emerald-500 bg-emerald-50" : "border-gray-100 hover:border-emerald-200"}`}
            >
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">💳</div>
                <div className="flex-1">
                    <p className="font-bold text-gray-700">Thẻ Quốc Tế (Visa/Mastercard)</p>
                    <p className="text-xs text-gray-400">Thanh toán qua cổng Stripe an toàn</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === "stripe" ? "border-emerald-500" : "border-gray-300"}`}>
                    {method === "stripe" && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>}
                </div>
            </div>
          </div>

          {/* KHU VỰC HIỂN THỊ FORM THANH TOÁN TƯƠNG ỨNG */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            {method === "vnpay" && (
                <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">Bạn đã chọn thanh toán qua VNPay</p>
                    <button onClick={handleVNPay} className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold uppercase shadow-lg shadow-blue-200 hover:bg-blue-600">
                        Tiếp tục qua VNPay
                    </button>
                </div>
            )}

            {method === "stripe" && (
                clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <StripeCheckoutForm amount={Number(amount)} />
                    </Elements>
                ) : (
                    <div className="text-center py-10">
                        <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-sm text-gray-400">Đang khởi tạo cổng Stripe...</p>
                        <p className="text-[10px] text-red-400 mt-2">Nếu không hiện form, vui lòng kiểm tra xem Server Backend đã chạy chưa.</p>
                    </div>
                )
            )}
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT (Giữ nguyên) */}
        <div className="lg:col-span-2 bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-200 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
             <div className="relative z-10">
               <p className="text-black font-black text-gray-800 uppercase tracking-[0.2em] mb-6 text-center">Đơn hàng</p>
               {tour ? (
                 <div className="space-y-4">
                   <h3 className="text-xl font-black italic">{tour.name}</h3>
                   <div className="border-t border-white/20 pt-4 space-y-2 text-sm">
                       <div className="flex justify-between"><span>Ngày đi:</span> <b>{date}</b></div>
                       <div className="flex justify-between"><span>Số khách:</span> <b>{guests}</b></div>
                       <div className="flex justify-between text-lg pt-2 border-t border-white/20"><span>Tổng tiền:</span> <b>{Number(amount).toLocaleString()}đ</b></div>
                   </div>
                 </div>
               ) : <p>Đang tải...</p>}
             </div>
        </div>

      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}