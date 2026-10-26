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
