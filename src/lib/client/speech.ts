"use client";
/**
 * 语音交互（Web Speech API，浏览器原生能力，零成本、低延迟）：
 * - useSpeechInput：按住说话，实时显示识别中的文字（中文普通话）
 * - speak：用中文语音朗读结论，语速放慢，适合老人
 */
import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Recognition = any;

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechInput(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

/** 朗读文字；返回停止函数 */
export function speak(text: string, opts: { rate?: number } = {}): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*#>`]/g, ""));
  u.lang = "zh-CN";
  u.rate = opts.rate ?? 0.9;
  const voice = synth.getVoices().find((v) => v.lang.startsWith("zh-CN") || v.lang.startsWith("zh"));
  if (voice) u.voice = voice;
  synth.speak(u);
  return () => synth.cancel();
}
