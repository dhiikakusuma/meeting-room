import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login/admin");
  if (user.role !== "admin") redirect("/");
  return (
    <AppShell role="admin" user={user}>
      {children}
    </AppShell>
  );
}
