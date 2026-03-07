"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function Content() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const isSuccess = status === "success";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl p-8 text-center border">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Đặt tour thành công!</h1>
            <p className="text-gray-500 mt-3">Cảm ơn bạn đã tin tưởng. Thông tin chi tiết đã được gửi về email cá nhân của bạn.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Thanh toán thất bại</h1>
            <p className="text-gray-500 mt-3">Rất tiếc, giao dịch không thực hiện được. Vui lòng kiểm tra lại tài khoản hoặc thử phương thức khác.</p>
          </>
        )}

        <div className="mt-10 space-y-3">
          <Link href="/" className="block w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
            Về trang chủ
          </Link>
          
        </div>
      </div>
    </div>
  );
}

// Bọc trong Suspense vì dùng useSearchParams
export default function PaymentConfirmPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <Content />
    </Suspense>
  );
}