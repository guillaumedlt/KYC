import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/features/command-palette";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={user.full_name} userRole={user.role} />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
