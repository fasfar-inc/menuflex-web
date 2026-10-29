/** A price whose currency sign is set in Inter: the serif has no ₺ and would fall back to a mismatched glyph. */
export function Price({ value, className }: { value: string; className: string }) {
  const m = value.match(/^(\D*)(.*)$/);
  return (
    <span className={className}>
      {m?.[1] && <span className="mr-[0.04em] font-sans text-[0.84em] font-light">{m[1]}</span>}
      {m?.[2] ?? value}
    </span>
  );
}
