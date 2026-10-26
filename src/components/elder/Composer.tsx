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
