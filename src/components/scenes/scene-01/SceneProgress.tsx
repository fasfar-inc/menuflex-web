import { sceneChapters } from "@/content/site";

/** Chapter indicator (01 Paper / 02 Layers / 03 Digital). Scene 01 is active. */
export function SceneProgress({ active = 0 }: { active?: number }) {
  return (
    <ol className="relative flex items-center gap-10 pt-5 xl:gap-12" aria-label="Homepage chapters">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-ink/15" />
      {sceneChapters.map((chapter, i) => {
        const isActive = i === active;
        return (
          <li
            key={chapter.index}
            aria-current={isActive ? "step" : undefined}
            className={`relative text-[12px] font-medium tracking-[0.24em] uppercase ${
              isActive ? "text-ink-soft" : "text-ink-muted/80"
            }`}
          >
            {isActive && <span aria-hidden="true" className="absolute inset-x-0 -top-5 h-[2px] bg-white" />}
            <span className={isActive ? "text-coral" : ""}>{chapter.index}</span>{" "}
            {chapter.label}
          </li>
        );
      })}
    </ol>
  );
}
