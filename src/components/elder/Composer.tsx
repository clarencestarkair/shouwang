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
