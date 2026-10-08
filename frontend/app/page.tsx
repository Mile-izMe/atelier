import { CatalogHero } from "@/src/features";

export default function Home() {
  return (
    <main>
      <CatalogHero />

      <footer className="border-t border-line bg-background px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <span className="text-lg font-medium tracking-tight">ATELIER</span>
          <p className="text-xs text-muted">Những điều giản dị. Mỗi ngày.</p>
        </div>
      </footer>
    </main>
  );
}
