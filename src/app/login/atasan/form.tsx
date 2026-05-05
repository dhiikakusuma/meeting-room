"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

export function LoginAtasanForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/atasan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Login gagal");
      setBusy(false);
      return;
    }
    router.replace(data.redirect ?? "/atasan");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5"
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" size="lg" variant="gold" disabled={busy || !password}>
        {busy ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
