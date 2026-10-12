import { Button } from "@/components/ui/button";
import { useSiteImage } from "@/lib/site-images";

export function FinalCta() {
  const jar = useSiteImage("final-cta");
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="relative isolate overflow-hidden rounded-3xl border border-gold/25 bg-sidebar shadow-warm-lg">
          <img
            src={jar}
            alt="Jar of Veerja Eats A2 cow ghee"
            loading="lazy"
            width={1024}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-sidebar/65" />
          <div className="relative px-6 py-14 text-center sm:px-12 lg:py-20">
            <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight font-semibold text-sidebar-foreground sm:text-4xl lg:text-5xl">
              Bring Home the Golden Goodness.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-sidebar-foreground sm:text-base">
              Experience the rich taste and timeless tradition of premium A2 Cow Ghee.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-gold text-sidebar-primary-foreground shadow-warm hover:bg-gold-deep hover:text-sidebar-primary-foreground focus-visible:ring-sidebar-foreground"
            >
              <a href="#our-ghee">Shop A2 Ghee</a>
            </Button>
          </div>
        </div>
    </section>
  );
}
