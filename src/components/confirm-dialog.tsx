"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  /** Kalau di-set, user harus mengetik teks ini agar tombol confirm aktif (2-step confirm). */
  requireType?: string;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Hapus",
  cancelText = "Batal",
  destructive = true,
  requireType,
  onConfirm,
}: Props) {
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTyped("");
      setBusy(false);
    }
  }, [open]);

  const canConfirm = !requireType || typed.trim() === requireType;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink-100 bg-white p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <div
              className={
                destructive
                  ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700"
                  : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-700"
              }
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="serif text-lg font-semibold text-ink-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-ink-500 mt-1.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
          </div>

          {requireType && (
            <div className="mt-4">
              <p className="text-xs text-ink-500 mb-2">
                Ketik <code className="rounded bg-cream-100 px-1.5 py-0.5 text-ink-900 font-mono text-[11px]">{requireType}</code> untuk konfirmasi
              </p>
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={requireType}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              {cancelText}
            </Button>
            <Button
              variant={destructive ? "destructive" : "default"}
              disabled={!canConfirm || busy}
              onClick={handleConfirm}
            >
              {busy ? "Memproses…" : confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
