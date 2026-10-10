import { useState } from "react";
import { Minus, Plus, ShoppingBag, Star, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { PRODUCT, inr } from "@/lib/shop-data";
import { cn } from "@/lib/utils";
import gheeJar from "@/assets/ghee-jar.jpg";
import { Reveal, SectionHeading } from "./Reveal";

export function ProductSection() {
  const { addItem, openCart, openCheckout } = useCart();
  const [sizeId, setSizeId] = useState(PRODUCT.sizes[1]!.id);
  const [qty, setQty] = useState(1);

  const size = PRODUCT.sizes.find((s) => s.id === sizeId)!;

  const add = () => {
    addItem({
      productId: PRODUCT.id,
      name: PRODUCT.name,
      sizeId: size.id,
      sizeLabel: size.label,
      price: size.price,
      quantity: qty,
      image: gheeJar,
    });
  };

  return (
    <section id="our-ghee" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading
        eyebrow="Shop A2 Ghee"
        title="Our Golden Goodness"
        subtitle="One product, made properly. Choose your jar size and bring home the tradition."
      />

      <Reveal className="mt-12">
        <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-warm lg:grid-cols-2">
          <div className="group relative overflow-hidden bg-beige">
            <img
              src={gheeJar}
              alt={PRODUCT.name}
              loading="lazy"
              width={1024}
              height={1024}
              className="aspect-square h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute top-4 left-4 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-gold-deep shadow-sm backdrop-blur">
              Bestseller
            </span>
          </div>

          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-2">
              <span className="flex text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </span>
              <span className="text-sm text-muted-foreground">
                {PRODUCT.rating} · {PRODUCT.reviewCount.toLocaleString("en-IN")} reviews
              </span>
            </div>

            <h3 className="mt-3 font-display text-2xl font-semibold text-brown sm:text-3xl">
              {PRODUCT.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {PRODUCT.description}
            </p>

            <div className="mt-6">
              <span className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Pack size
              </span>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {PRODUCT.sizes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSizeId(s.id)}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                      s.id === sizeId
                        ? "border-gold bg-gold/12 text-brown shadow-warm"
                        : "border-border bg-background text-foreground/70 hover:border-gold/50",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-display text-4xl font-semibold text-brown">
                {inr(size.price)}
              </span>
              <span className="text-base text-muted-foreground line-through">{inr(size.mrp)}</span>
              <span className="rounded-full bg-leaf/12 px-2.5 py-1 text-xs font-semibold text-leaf">
                Save {inr(size.mrp - size.price)}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg text-brown transition-colors hover:bg-secondary"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-brown">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg text-brown transition-colors hover:bg-secondary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="h-4 w-4 text-leaf" /> Free delivery across India
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => {
                  add();
                  openCart();
                  toast.success("Added to your cart", {
                    description: `${qty} × ${PRODUCT.shortName} (${size.label})`,
                  });
                }}
                className="flex-1 bg-gradient-to-r from-gold to-gold-deep text-primary-foreground shadow-warm transition-transform hover:-translate-y-0.5 hover:opacity-95"
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
              </Button>
              <Button
                size="lg"
                variant="purchase"
                onClick={() => {
                  add();
                  openCheckout();
                }}
                className="flex-1"
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
