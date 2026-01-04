export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-container">
      {/* Không có Header và Footer ở đây */}
      {children}
    </div>
  );
}