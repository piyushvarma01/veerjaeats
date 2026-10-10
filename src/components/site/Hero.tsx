import { motion } from "motion/react";
import { Leaf, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSiteImage } from "@/lib/site-images";

export function Hero() {
  const gheeJar = useSiteImage("hero");
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gold/25 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-24 h-96 w-96 rounded-full bg-leaf/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 md:pt-16 lg:grid-cols-2 lg:gap-16 lg:pb-24">
        <div className="min-w-0">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-gold-deep shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" /> Premium A2 Cow Ghee
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-5 font-display text-4xl leading-[1.05] font-semibold text-brown sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Pure Tradition.
            <span className="block text-gradient-gold">Golden Goodness.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Hand-churned by the traditional bilona method from the milk of free-grazing desi cows.
            Grainy, aromatic and deeply nourishing — the ghee your kitchen deserves.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-gold to-gold-deep text-primary-foreground shadow-warm transition-transform hover:-translate-y-0.5 hover:opacity-95"
            >
              <a href="#our-ghee">Shop A2 Ghee</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-brown/25 bg-card text-brown hover:bg-secondary"
            >
              <a href="#why">Discover Our Story</a>
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6"
          >
            {[
              { k: "100%", v: "Pure & Lab Tested" },
              { k: "12k+", v: "Happy Families" },
              { k: "4.9★", v: "Average Rating" },
            ].map((s) => (
              <div key={s.k} className="min-w-0">
                <dt className="font-display text-2xl font-semibold text-gold-deep">{s.k}</dt>
                <dd className="mt-1 text-xs leading-snug text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative min-w-0"
        >
          <div className="absolute inset-6 rounded-[3rem] bg-gradient-to-br from-gold/35 to-leaf/10 blur-2xl" />
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative overflow-hidden rounded-[2rem] border border-gold/25 bg-card shadow-warm-lg"
          >
            <img
              src={gheeJar}
              alt="Veerja Eats premium A2 cow ghee in a glass jar with a wooden spoon"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-4 -left-2 flex items-center gap-2.5 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-warm backdrop-blur sm:-left-6"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf/12 text-leaf">
              <Leaf className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-brown">Bilona Churned</span>
              <span className="block text-xs text-muted-foreground">Small batch, wood fire</span>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
