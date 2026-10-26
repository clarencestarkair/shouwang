/** 长辈端个性化设置（Zustand + localStorage 持久化） */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  elderName: string;
  familyPhone: string;
  autoSpeak: boolean;
  /** 字号档位：1 标准 / 2 大 / 3 特大 */
  fontLevel: 1 | 2 | 3;
  set: (patch: Partial<Omit<SettingsState, "set">>) => void;
}
