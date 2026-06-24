export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar goes here */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
