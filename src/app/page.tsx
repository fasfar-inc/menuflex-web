import { SiteHeader } from "@/components/layout/SiteHeader";
import { HeroScene } from "@/components/scenes/scene-01/HeroScene";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroScene />
      </main>
    </>
  );
}
