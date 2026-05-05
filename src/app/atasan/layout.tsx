import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AtasanLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login/atasan");
  if (user.role !== "atasan") redirect("/");
  return (
    <AppShell role="atasan" user={user}>
      {children}
    </AppShell>
  );
}
