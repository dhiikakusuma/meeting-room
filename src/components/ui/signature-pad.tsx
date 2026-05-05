"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignaturePadHandle = {
  isEmpty: () => boolean;
  clear: () => void;
  toDataURL: () => string;
};

type Props = {
  label?: string;
  hint?: string;
  className?: string;
  /** Called whenever the user finishes a stroke. Receives the data URL or null if empty. */
  onChange?: (dataUrl: string | null) => void;
};

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { label, hint, className, onChange },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [empty, setEmpty] = useState(true);

  // Resize canvas to match container width while preserving HiDPI quality.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = wrap.clientWidth;
      const height = 180;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      ctx?.scale(ratio, ratio);
      // Re-init pad after resize (clears existing strokes — which is fine on mount)
      if (!padRef.current) {
        padRef.current = new SignaturePadLib(canvas, {
          backgroundColor: "rgba(255,255,255,1)",
          penColor: "#0f172a",
          minWidth: 0.6,
          maxWidth: 1.8,
        });
        padRef.current.addEventListener("endStroke", () => {
          const isEmpty = padRef.current?.isEmpty() ?? true;
          setEmpty(isEmpty);
          onChange?.(isEmpty ? null : padRef.current!.toDataURL("image/png"));
        });
      } else {
        padRef.current.clear();
        setEmpty(true);
        onChange?.(null);
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      clear: () => {
        padRef.current?.clear();
        setEmpty(true);
        onChange?.(null);
      },
      toDataURL: () => padRef.current?.toDataURL("image/png") ?? "",
    }),
    [onChange],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.14em] uppercase serif text-gold-700">
            {label}
          </p>
          <button
            type="button"
            onClick={() => {
              padRef.current?.clear();
              setEmpty(true);
              onChange?.(null);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-900"
          >
            <Eraser className="h-3 w-3" />
            Bersihkan
          </button>
        </div>
      )}
      <div
        ref={wrapRef}
        className="relative rounded-xl border border-ink-200 bg-white overflow-hidden"
      >
        <canvas ref={canvasRef} className="touch-none block w-full" />
        {empty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] text-ink-400 italic serif">
            Tanda tangan di sini
          </p>
        )}
      </div>
      {hint && <p className="text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
});
