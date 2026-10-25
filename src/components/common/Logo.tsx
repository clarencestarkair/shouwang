/** 品牌标识：圆角方块中的“守望之眼”——外圈是守护，内点是注视 */
export function LogoMark({ size = 28, inverted = false }: { size?: number; inverted?: boolean }) {
  const bg = inverted ? "var(--surface)" : "var(--ink)";
  const fg = inverted ? "var(--ink)" : "var(--surface)";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill={bg} />
      <path d="M6.5 16c2.6-4.4 5.8-6.6 9.5-6.6s6.9 2.2 9.5 6.6c-2.6 4.4-5.8 6.6-9.5 6.6S9.1 20.4 6.5 16z" fill="none" stroke={fg} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="3.2" fill={fg} />
    </svg>
  );
}
