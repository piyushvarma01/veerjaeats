import { Button } from "@/components/ui/button";
import { useSiteImage } from "@/lib/site-images";
import { Reveal } from "./Reveal";

export function FinalCta() {
  const jar = useSiteImage("final-cta");
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-gold/25 shadow-warm-lg">
          <img
            src={jar}
            alt="Jar of Veerja Eats A2 cow ghee"
            loading="lazy"
            width={1024}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brown/92 via-brown/80 to-brown/45" />
          <div className="relative px-6 py-14 text-center sm:px-12 lg:py-20">
            <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight font-semibold text-primary-foreground sm:text-4xl lg:text-5xl">
              Bring Home the Golden Goodness.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
              Experience the rich taste and timeless tradition of premium A2 Cow Ghee.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-gradient-to-r from-gold to-gold-deep text-primary-foreground shadow-warm transition-transform hover:-translate-y-0.5 hover:opacity-95"
            >
              <a href="#our-ghee">Shop A2 Ghee</a>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
