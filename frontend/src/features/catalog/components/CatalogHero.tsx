import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export default function CatalogHero() {
  return (
    <section aria-labelledby="hero-title" className="bg-surface-hero">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 sm:py-20 lg:px-16">
          <p className="mb-8 text-[10px] font-medium tracking-[0.3em] text-muted">
            ATELIER / EVERYDAY EDIT
          </p>
          <h1
            id="hero-title"
            className="max-w-lg text-[clamp(2.75rem,5vw,5rem)] font-normal leading-[1.08] tracking-[-0.055em] text-foreground"
          >
            Ít hơn.
            <br />
            <span className="font-serif italic text-accent">
              Đủ cho mỗi ngày.
            </span>
          </h1>
          <p className="mb-9 mt-7 max-w-xs text-sm leading-7 text-muted">
            Những lựa chọn giản dị cho tủ đồ, góc làm việc và những hành trình
            thường ngày.
          </p>
          <a
            href="#catalog"
            className="group inline-flex w-fit items-center gap-8 rounded-full bg-action px-6 py-3.5 text-sm text-action-foreground transition hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Khám phá sản phẩm{" "}
            <ArrowUpRight
              aria-hidden
              className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
          <p className="mt-14 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted">
            <ArrowDown aria-hidden className="h-3 w-3" /> Chậm lại, chọn điều
            phù hợp.
          </p>
        </div>
        <div className="relative min-h-[340px] sm:min-h-[460px] lg:min-h-[610px]">
          <Image
            src="/images/atelier-everyday-hero.png"
            alt="Áo màu kem, túi canvas và tai nghe trong ánh nắng dịu"
            fill
            preload
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-right"
          />
          <span className="absolute bottom-6 right-6 rounded-full bg-surface/70 px-4 py-2 text-[10px] tracking-[0.18em] text-muted backdrop-blur-sm">
            THE EVERYDAY COLLECTION
          </span>
        </div>
      </div>
    </section>
  );
}
