import { Button } from "@/components/ui/button";
import { useSiteImage } from "@/lib/site-images";

export function FinalCta() {
  const jar = useSiteImage("final-cta");
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="group relative isolate aspect-[16/7] min-h-56 overflow-hidden rounded-3xl border border-gold/25 bg-sidebar shadow-warm-lg">
          <img
            src={jar}
            alt="Veerja Eats A2 cow ghee"
            loading="lazy"
            width={1024}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 bg-sidebar/0 transition-colors duration-300 group-hover:bg-sidebar/30" />
          <div className="absolute inset-0 flex items-end justify-center pb-6 sm:items-center sm:pb-0">
            <Button
              asChild
              size="lg"
              className="bg-gold text-sidebar-primary-foreground shadow-warm transition-all duration-300 hover:bg-gold-deep hover:text-sidebar-primary-foreground focus-visible:opacity-100 focus-visible:ring-sidebar-foreground sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
            >
              <a href="#our-ghee">Shop Now</a>
            </Button>
          </div>
        </div>
    </section>
  );
}
