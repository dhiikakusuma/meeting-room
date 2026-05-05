import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function PemohonLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login/pemohon");
  if (user.role !== "pemohon") redirect("/");
  return (
    <AppShell role="pemohon" user={user}>
      {children}
    </AppShell>
  );
}
