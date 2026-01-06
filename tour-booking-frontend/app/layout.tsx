import "./globals.css"; // Dùng một dấu chấm vì globals.css nằm ngay cạnh

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}