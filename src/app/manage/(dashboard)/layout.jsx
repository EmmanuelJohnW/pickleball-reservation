import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function ManageDashboardLayout({ children }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar user={user} />
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
