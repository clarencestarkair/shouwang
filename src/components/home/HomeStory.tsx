"use client";
/**
 * 首页叙事：“40 秒里发生了什么”。
 * 左侧手机随滚动切换状态（收到短信 → 标出可疑句 → AI 分析中 → 整屏警示），
 * 右侧五个步骤各附一组真实测得的数据。所有内容静止时完整可见，滚动只负责高亮当前步骤。
 */
import { useEffect, useRef, useState } from "react";
import { Bell, Brain, Database, Eye, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
