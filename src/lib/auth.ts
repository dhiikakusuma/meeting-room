import { cookies } from "next/headers";
import crypto from "crypto";
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

function getSecret(): string {
  // Prefer SESSION_SECRET; fall back to NEXTAUTH_SECRET (kalau user pakai konvensi itu).
  // Dalam dev, kalau tidak ada secret, pakai placeholder yang ditandai jelas
  // supaya cookies dari satu deployment tidak valid di deployment lain.
  return (
    process.env.SESSION_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-only-insecure-session-secret-change-me"
  );
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function pack(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

function unpack(packed: string | undefined): string | null {
  if (!packed) return null;
  const idx = packed.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = packed.slice(0, idx);
  const provided = packed.slice(idx + 1);
  const expected = sign(userId);
  // timingSafeEqual butuh panjang sama untuk menghindari leak via early-return
  if (provided.length !== expected.length) return null;
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    return ok ? userId : null;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, pack(userId), {
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
  const raw = jar.get(SESSION_COOKIE)?.value;
  const id = unpack(raw);
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
