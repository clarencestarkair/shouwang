"use client";
/**
 * 语音交互（Web Speech API，浏览器原生能力，零成本、低延迟）：
 * - useSpeechInput：按住说话，实时显示识别中的文字（中文普通话）
 * - speak：用中文语音朗读结论，语速放慢，适合老人
 */
import { useCallback, useEffect, useRef, useState } from "react";
