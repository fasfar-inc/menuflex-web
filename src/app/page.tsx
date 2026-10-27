import { SiteHeader } from "@/components/layout/SiteHeader";
import { HeroScene } from "@/components/scenes/scene-01/HeroScene";
import { OpeningSequence } from "@/components/scenes/scene-01/OpeningSequence";

export default function HomePage() {
  return (
    <OpeningSequence>
      <SiteHeader />
      <main>
        <HeroScene />
      </main>
    </OpeningSequence>
  );
}
