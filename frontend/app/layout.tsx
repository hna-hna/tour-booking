//frontend/app/layout.tsx//
/*rôt layour (chứa html, body)*/
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tour Booking System",
  description: "Đặt tour du lịch nhanh chóng và tiện lợi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased text-gray-900 bg-white"
        suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}