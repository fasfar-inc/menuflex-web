/** Hand-drawn coral stroke beneath "than paper." */
export function HeadlineUnderline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        data-underline
        d="M3 15.5C70 8.5 170 4.8 270 5.6c62 .5 122 3 187 7.4"
        stroke="var(--coral)"
        strokeWidth="4.2"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  );
}
