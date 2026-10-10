import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import farm from "@/assets/farm.jpg";
import texture from "@/assets/ghee-texture.jpg";
import jar from "@/assets/ghee-jar.jpg";
import { Reveal, SectionHeading } from "./Reveal";

export function Showcase({ images = [] }: { images?: { id: string; image_url: string; caption: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  if (images.length > 0) {
    return (
      <section id="gallery" className="bg-beige/60 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow="The Veerja World" title="Our Gallery" />
          <div className="mt-12 columns-2 gap-4 md:columns-3 [&>*]:mb-4">
            {images.map((img) => (
              <figure key={img.id} className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-border shadow-warm">
                <img src={img.image_url} alt={img.caption || "Veerja Eats gallery photo"} loading="lazy" className="w-full transition-transform duration-700 group-hover:scale-105" />
                {img.caption && <figcaption className="absolute bottom-0 w-full bg-gradient-to-t from-brown/80 to-transparent p-4 font-display text-lg text-primary-foreground">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-beige/60 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="The Veerja World"
          title="Golden, Grainy, Unmistakably Pure"
          subtitle="Open pastures, earthen pots, wooden spoons and slow fire — this is where our ghee comes from."
        />

        <div ref={ref} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal className="sm:col-span-2 lg:col-span-2">
            <figure className="group relative h-72 overflow-hidden rounded-3xl border border-border shadow-warm sm:h-96">
              <motion.img
                style={{ y }}
                src={farm}
                alt="Desi cows grazing on an Indian farm at golden hour"
                loading="lazy"
                width={1408}
                height={912}
                className="h-[115%] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <figcaption className="absolute bottom-0 w-full bg-gradient-to-t from-brown/80 to-transparent p-5 font-display text-xl text-primary-foreground">
                Free-grazing desi cows
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.1}>
            <figure className="group h-72 overflow-hidden rounded-3xl border border-border shadow-warm sm:h-96">
              <img
                src={texture}
                alt="Close-up of grainy golden A2 ghee in an earthen bowl"
                loading="lazy"
                width={1408}
                height={912}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </figure>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-3">
            <figure className="group relative overflow-hidden rounded-3xl border border-border shadow-warm">
              <img
                src={jar}
                alt="Veerja Eats A2 cow ghee jar in a traditional Indian kitchen"
                loading="lazy"
                width={1024}
                height={1024}
                className="h-64 w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 sm:h-80"
              />
              <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-brown/75 via-transparent to-transparent p-6">
                <span className="font-display text-2xl text-primary-foreground sm:text-3xl">
                  Hand-packed in glass, sealed with care
                </span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
