import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "mr_session";

export type Role = "pemohon" | "admin" | "atasan";

export type SessionUser = {
  id: string;
  namaLengkap: string;
  jabatan: string | null;
  role: string;
  bidangId: string | null;
  bidang: { id: string; nama: string } | null;
};

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      namaLengkap: true,
      jabatan: true,
      role: true,
      bidangId: true,
      bidang: { select: { id: true, nama: true } },
    },
  });
  return user;
}

export async function requireRole(role: Role | Role[]) {
  const user = await getSessionUser();
  if (!user) return null;
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role as Role)) return null;
  return user;
}
