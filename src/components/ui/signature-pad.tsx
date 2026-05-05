"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
  /** Initial / default name — used for atasan whose name is known from session. */
  defaultName?: string;
  /** Read-only name input (e.g. when name comes from session). */
  nameLocked?: boolean;
  /** Called whenever the rendered signature changes. Receives the data URL or null if empty. */
  onChange?: (dataUrl: string | null) => void;
};

const CANVAS_W = 480;
const CANVAS_H = 140;

function renderSignatureToCanvas(canvas: HTMLCanvasElement, name: string) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = CANVAS_W * ratio;
  canvas.height = CANVAS_H * ratio;
  canvas.style.width = `${CANVAS_W}px`;
  canvas.style.height = `${CANVAS_H}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const trimmed = name.trim();
  if (!trimmed) return;

  // Auto-fit font size: try 64, scale down if name is too wide.
  let fontSize = 64;
  ctx.fillStyle = "#0f172a";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  // Caveat is loaded via next/font and exposed as --font-caveat
  const fontFamily = `"Caveat", "Brush Script MT", cursive`;
  for (; fontSize >= 28; fontSize -= 2) {
    ctx.font = `600 ${fontSize}px ${fontFamily}`;
    if (ctx.measureText(trimmed).width <= CANVAS_W - 40) break;
  }
  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  ctx.fillText(trimmed, CANVAS_W / 2, CANVAS_H / 2 + 4);
}

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { label, hint, className, defaultName, nameLocked, onChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(defaultName ?? "");
  const empty = name.trim().length === 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const draw = () => {
      if (cancelled || !canvasRef.current) return;
      renderSignatureToCanvas(canvasRef.current, name);
      onChange?.(empty ? null : canvasRef.current.toDataURL("image/png"));
    };
    // Wait for fonts to be ready so canvas uses the loaded Caveat font, not a fallback.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(draw).catch(draw);
    } else {
      draw();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useImperativeHandle(
    ref,
    () => ({
      isEmpty: () => empty,
      clear: () => {
        setName(nameLocked ? (defaultName ?? "") : "");
      },
      toDataURL: () =>
        canvasRef.current && !empty ? canvasRef.current.toDataURL("image/png") : "",
    }),
    [empty, defaultName, nameLocked],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.14em] uppercase serif text-gold-700">
            {label}
          </p>
          {!nameLocked && (
            <button
              type="button"
              onClick={() => setName("")}
              className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-900"
            >
              <Eraser className="h-3 w-3" />
              Bersihkan
            </button>
          )}
        </div>
      )}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        readOnly={nameLocked}
        placeholder="Ketik nama lengkap"
        className={cn(
          "w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-gold-300 focus:border-gold-400",
          nameLocked && "bg-ink-50 text-ink-700 cursor-not-allowed",
        )}
      />
      <div className="rounded-xl border border-ink-200 bg-white overflow-hidden flex justify-center">
        <canvas ref={canvasRef} className="block" />
      </div>
      {empty && (
        <p className="text-[11px] text-ink-400 italic">
          Ketik nama untuk menghasilkan tanda tangan otomatis.
        </p>
      )}
      {hint && <p className="text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
});
