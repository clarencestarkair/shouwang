"use client";
/**
 * Markdown 渲染（按需加载）：react-markdown 体积较大，只在出现 AI 回复时才下载，
 * 减小长辈端首屏 JS 体积。
 */
import dynamic from "next/dynamic";

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
