"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Khởi tạo Stripe ngoài Component để tránh init lại nhiều lần
const stripePromise = loadStripe("pk_test_51Szx98359mScY0lGSspDSZzzZ60Hth9U2TTKEZyTO5lALa04gRcUnhx4E6WXt93jKTpm5H3lHGvgNJPg2Savcgh600hYOh3wtr");

// --- COMPONENT CON: FORM THANH TOÁN STRIPE ---
function StripeCheckoutForm({ amount, tourId }: { amount: number; tourId: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { 
        return_url: `${window.location.origin}/payment-success?tourId=${tourId}` 
      },
    });

    if (error) {
      setErrorMessage(error.message || "Lỗi giao dịch");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 animate-fade-in">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
        <PaymentElement />
      </div>
      <button 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold uppercase hover:bg-emerald-700 transition-all disabled:bg-gray-300"
      >
        {isProcessing ? "Đang xử lý..." : `Xác nhận thanh toán ${Number(amount).toLocaleString()}đ`}
      </button>
      {errorMessage && <p className="text-red-500 text-sm mt-2 text-center font-bold">{errorMessage}</p>}
    </form>
  );
}

// --- COMPONENT CHÍNH ---
function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tourId = searchParams.get("id");
  const amount = searchParams.get("amount");
  const guests = searchParams.get("guests");
  const date = searchParams.get("date");

  const [tour, setTour] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [method, setMethod] = useState<"vnpay" | "stripe">("vnpay");
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút

  // 1. Đếm ngược thời gian
  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Hết thời gian thanh toán!");
      router.push(`/tours/${tourId || ""}`);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, router, tourId]);

  // 2. Lấy thông tin Tour
  useEffect(() => {
    if (tourId) {
      axios.get(`http://127.0.0.1:5000/api/tours/${tourId}`)
        .then(res => setTour(res.data))
        .catch(err => console.error("Lỗi lấy tour:", err));
    }
  }, [tourId]);

  // 3. Khởi tạo Stripe Payment Intent khi chọn Stripe
  useEffect(() => {
    if (method === "stripe" && amount && !clientSecret) {
      const token = localStorage.getItem("token");
      fetch("http://127.0.0.1:5000/create-payment-intent", {
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
        }),
      })
      .then((res) => res.json())
      .then((data) => {
        const secret = data.clientSecret || data.client_secret;
        if (secret) setClientSecret(secret);
      })
      .catch(() => alert("Không thể kết nối cổng thanh toán Stripe!"));
    }
  }, [method, amount, clientSecret, tourId, guests, date]);

  // 4. Xử lý VNPay
  const handleVNPay = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập!");

    try {
      const res = await fetch("http://localhost:5000/create_payment_vnpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(amount), tour_id: tourId, guests, date })
      });
      const data = await res.json();
      if (data.paymentUrl) window.location.href = data.paymentUrl;
    } catch (err) {
      alert("Lỗi kết nối VNPay");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* CỘT TRÁI: CHỌN PHƯƠNG THỨC */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 shadow-xl border border-emerald-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-800 uppercase italic">Thanh toán</h2>
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold border border-red-100 animate-pulse">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="space-y-4">
            {/* VNPay Option */}
            <div 
              onClick={() => setMethod("vnpay")}
              className={`p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all ${method === "vnpay" ? "border-emerald-500 bg-emerald-50" : "border-gray-100"}`}
            >
              <div className="text-2xl">🏧</div>
              <div className="flex-1">
                <p className="font-bold">VNPay / ATM Nội địa</p>
                <p className="text-xs text-gray-400">Thanh toán qua ngân hàng Việt Nam</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${method === "vnpay" ? "border-emerald-500 bg-emerald-500" : "border-gray-300"}`}></div>
            </div>

            {/* Stripe Option */}
            <div 
              onClick={() => setMethod("stripe")}
              className={`p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all ${method === "stripe" ? "border-emerald-500 bg-emerald-50" : "border-gray-100"}`}
            >
              <div className="text-2xl">💳</div>
              <div className="flex-1">
                <p className="font-bold">Thẻ Quốc Tế (Visa/Mastercard)</p>
                <p className="text-xs text-gray-400">Cổng thanh toán toàn cầu Stripe</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${method === "stripe" ? "border-emerald-500 bg-emerald-500" : "border-gray-300"}`}></div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            {method === "vnpay" && (
              <button onClick={handleVNPay} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase shadow-lg hover:bg-blue-700">
                Tiếp tục thanh toán VNPay
              </button>
            )}

            {method === "stripe" && (
              clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckoutForm amount={Number(amount)} tourId={tourId} />
                </Elements>
              ) : <p className="text-center text-gray-400 animate-pulse">Đang tải form Stripe...</p>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT */}
        <div className="lg:col-span-2 bg-emerald-500 rounded-[2.5rem] p-8 text-white shadow-xl">
          <h3 className="text-center font-black uppercase tracking-widest mb-6">Tóm tắt đơn hàng</h3>
          {tour ? (
            <div className="space-y-4">
              <p className="text-xl font-bold italic">{tour.name}</p>
              <div className="border-t border-white/20 pt-4 space-y-3">
                <div className="flex justify-between text-sm"><span>Ngày đi:</span> <b>{date}</b></div>
                <div className="flex justify-between text-sm"><span>Số khách:</span> <b>{guests}</b></div>
                <div className="flex justify-between text-xl pt-4 border-t border-white/30 font-black">
                  <span>TỔNG TIỀN:</span>
                  <span>{Number(amount).toLocaleString()}đ</span>
                </div>
              </div>
            </div>
          ) : <p>Đang tải thông tin tour...</p>}
        </div>

      </div>
    </div>
  );
}

// WRAPPER CHO SUSPENSE
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải dữ liệu...</div>}>
      <PaymentContent />
    </Suspense>
  );
}