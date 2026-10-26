"use client";
/**
 * 长辈端输入区：语音优先。
 * - 按住说话（Web Speech API，松开自动发送）
 * - 拍照/传截图（端侧压缩 + 二维码解析）
 * - 打字/粘贴（复制短信直接粘贴）
 */
import { useRef, useState } from "react";
import { ArrowUp, Camera, Loader2, Mic, Square, X } from "lucide-react";
import { useSpeechInput } from "@/lib/client/speech";
import { prepareImage, type PreparedImage } from "@/lib/client/image";
import { cn } from "@/lib/utils";

export interface ComposerSubmit {
  text: string;
  images: PreparedImage[];
}

export function Composer({ onSubmit, busy, onStop }: { onSubmit: (v: ComposerSubmit) => void; busy: boolean; onStop: () => void }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [preparing, setPreparing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (t = text) => {
    if (busy || preparing) return;
    if (!t.trim() && images.length === 0) return;
    onSubmit({ text: t.trim(), images });
    setText("");
    setImages([]);
  };

  const speech = useSpeechInput((spoken) => submit(spoken));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setPreparing(true);
    try {
      const prepared = await Promise.all([...files].slice(0, 3).map(prepareImage));
      setImages((prev) => [...prev, ...prepared].slice(0, 3));
    } finally {
      setPreparing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const canSend = Boolean(text.trim()) || images.length > 0;

  return (
    <div className="flex flex-wrap items-end gap-2.5 sm:flex-nowrap sm:gap-3">
      {speech.supported && (
        <button
          type="button"
          disabled={busy}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            speech.start();
          }}
          onPointerUp={speech.stop}
          onPointerCancel={speech.stop}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="按住说话，松开发送"
          className={cn(
            "relative order-last flex h-16 w-full shrink-0 select-none items-center justify-center gap-2.5 rounded-2xl px-6 text-[1.08rem] font-semibold text-surface shadow-md transition-[transform,background-color] duration-200 active:scale-[0.98] disabled:opacity-40 sm:order-none sm:w-auto",
            speech.listening ? "bg-danger" : "bg-ink hover:bg-ink/90",
          )}
        >
          {speech.listening && <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-2xl bg-danger/40" />}
          <Mic className="relative size-6" aria-hidden />
          <span className="relative">{speech.listening ? "松开发送" : "按住说话"}</span>
        </button>
      )}

      <div className="flex min-h-16 min-w-0 flex-1 flex-col justify-center rounded-2xl border border-line-2 bg-surface px-3 shadow-sm transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft">
        {(images.length > 0 || preparing) && (
          <div className="flex flex-wrap gap-2 pt-3">
            {images.map((img, i) => (
              <figure key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.dataUrl} alt={`待分析图片 ${i + 1}`} className="h-20 w-16 rounded-lg object-cover ring-1 ring-line" />
                {img.qr && <figcaption className="absolute inset-x-1 bottom-1 rounded bg-ink/80 text-center text-[0.65rem] text-surface">二维码</figcaption>}
                <button type="button" aria-label="移除图片" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-surface shadow">
                  <X className="size-3.5" />
                </button>
              </figure>
            ))}
            {preparing && (
              <div className="grid h-20 w-16 place-items-center rounded-lg bg-surface-2 text-ink-3">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="拍照或上传截图" className="mb-2.5 grid size-11 shrink-0 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
            <Camera className="size-6" aria-hidden />
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <label className="min-w-0 flex-1">
            <span className="sr-only">输入或粘贴要我看的内容</span>
            <textarea
              value={speech.listening ? speech.interim : text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              onPaste={(e) => {
                const files = e.clipboardData.files;
                if (files.length) {
                  e.preventDefault();
                  onFiles(files);
                }
              }}
              rows={1}
              placeholder={speech.listening ? "我在听，您说…" : "粘贴短信，或问我"}
              className="field-sizing-content block max-h-40 w-full resize-none bg-transparent py-[1.05rem] text-[1.08rem] leading-relaxed outline-none placeholder:text-ink-3"
            />
          </label>
          {busy ? (
            <button type="button" onClick={onStop} aria-label="停止" className="mb-2.5 grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-surface">
              <Square className="size-4 fill-current" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => submit()}
              disabled={!canSend}
              aria-label="发送"
              className={cn("mb-2.5 grid size-11 shrink-0 place-items-center rounded-xl transition-colors", canSend ? "bg-accent text-surface" : "bg-surface-2 text-ink-3")}
            >
              <ArrowUp className="size-5" strokeWidth={2.5} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
