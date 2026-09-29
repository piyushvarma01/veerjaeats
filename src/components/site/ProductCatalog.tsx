import { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { inr } from "@/lib/shop-data";
import { cn } from "@/lib/utils";
import gheeJar from "@/assets/ghee-jar.jpg";
import { Reveal, SectionHeading } from "./Reveal";

type Variant = {
  id: string;
  label: string;
  price: number;
  mrp: number;
  stock: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  description: string;
  image_url: string | null;
  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  is_featured?: boolean;
  images?: { url: string; alt: string }[];
  category?: { name: string; slug: string; sort_order: number } | null;
  product_variants: Variant[];
};

type SortKey = "featured" | "price-asc" | "price-desc" | "discount";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Popularity" },
  { id: "price-asc", label: "Price — low to high" },
  { id: "price-desc", label: "Price — high to low" },
  { id: "discount", label: "Biggest discount" },
];

const discountOf = (variant: Variant) =>
  variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0;

export function ProductCatalog({ products }: { products: CatalogProduct[] }) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [cat, setCat] = useState("all");
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; sort_order: number }>();
    products.forEach((p) => p.category && map.set(p.category.slug, p.category));
    return [...map.values()].sort((a, b) => a.sort_order - b.sort_order);
  }, [products]);

  const sorted = useMemo(() => {
    const list = products.filter((p) => cat === "all" || p.category?.slug === cat);
    if (sort === "featured") list.sort((a, b) => Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)));
    const best = (product: CatalogProduct) => product.product_variants[0]!;
    if (sort === "price-asc") list.sort((a, b) => best(a).price - best(b).price);
    if (sort === "price-desc") list.sort((a, b) => best(b).price - best(a).price);
    if (sort === "discount") list.sort((a, b) => discountOf(best(b)) - discountOf(best(a)));
    return list;
  }, [products, sort, cat]);

  return (
    <section id="our-ghee" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading
        eyebrow="Shop A2 Ghee"
        title="Our Golden Goodness"
        subtitle="Pick your pack size, check the savings, and add it straight to your cart."
      />

      {categories.length > 1 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {[{ slug: "all", name: "All products" }, ...categories].map((c) => (
            <button key={c.slug} onClick={() => setCat(c.slug)} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors", cat === c.slug ? "border-gold bg-gold text-brown" : "border-border bg-card text-foreground/70 hover:border-gold/60")}>{c.name}</button>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-border py-3">
        <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Sort by
        </span>
        {SORTS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSort(option.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              sort === option.id
                ? "bg-gold/15 text-brown"
                : "text-muted-foreground hover:text-brown",
            )}
          >
            {option.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "product" : "products"}
        </span>
      </div>

      <Reveal className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { addItem, openCart, openCheckout } = useCart();
  const [variantId, setVariantId] = useState(product.product_variants[0]!.id);
  const variant =
    product.product_variants.find((item) => item.id === variantId) ?? product.product_variants[0]!;
  const discount = discountOf(variant);
  const gallery = product.images?.length ? product.images : [{ url: product.image_url ?? gheeJar, alt: product.name }];
  const image = gallery[0]!.url;
  const outOfStock = variant.stock <= 0;

  const add = () => {
    addItem({
      productId: product.id,
      name: product.name,
      sizeId: variant.id,
      sizeLabel: variant.label,
      price: variant.price,
      quantity: 1,
      image,
    });
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-warm transition-shadow hover:shadow-warm-lg">
      <div className="relative overflow-hidden bg-beige">
        <ProductGallery images={gallery} name={product.name} />
        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-leaf px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            {discount}% off
          </span>
        )}
        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-1">
          {product.is_bestseller && <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-brown">Bestseller</span>}
          {product.is_new_arrival && <span className="rounded-full bg-brown px-2.5 py-1 text-xs font-semibold text-cream">New</span>}
        </div>
        {outOfStock && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-brown/55 text-sm font-semibold text-cream">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-leaf/12 px-1.5 py-0.5 text-xs font-semibold text-leaf">
            4.9 <Star className="h-3 w-3 fill-current" />
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5 text-gold-deep" /> Lab tested purity
          </span>
        </div>

        <h3 className="mt-2 font-display text-xl font-semibold text-brown">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {product.product_variants.map((item) => (
            <button
              key={item.id}
              onClick={() => setVariantId(item.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                item.id === variant.id
                  ? "border-gold bg-gold/12 text-brown"
                  : "border-border bg-background text-foreground/70 hover:border-gold/50",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <span className="font-display text-3xl font-semibold text-brown">{inr(variant.price)}</span>
          {variant.mrp > variant.price && (
            <>
              <span className="text-sm text-muted-foreground line-through">{inr(variant.mrp)}</span>
              <span className="text-xs font-semibold text-leaf">
                Save {inr(variant.mrp - variant.price)}
              </span>
            </>
          )}
        </div>

        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Truck className="h-4 w-4 text-leaf" /> Free delivery across India
          {!outOfStock && variant.stock <= 10 && (
            <span className="ml-1 font-semibold text-destructive">Only {variant.stock} left</span>
          )}
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Button
            disabled={outOfStock}
            onClick={() => {
              add();
              openCart();
              toast.success("Added to your cart", {
                description: `1 × ${product.short_name} (${variant.label})`,
              });
            }}
            className="flex-1 bg-gradient-to-r from-gold to-gold-deep text-primary-foreground shadow-warm hover:opacity-95"
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
          <Button
            variant="outline"
            disabled={outOfStock}
            onClick={() => {
              add();
              openCheckout();
            }}
            className="flex-1 border-brown/25 bg-brown text-primary-foreground hover:bg-brown/90"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </article>
  );
}

function ProductGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const go = (index: number) => {
    setActive(index);
    const el = track.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div>
      <div
        ref={track}
        onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== active) setActive(i); }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <button key={i} type="button" onClick={() => { setActive(i); setOpen(true); }} className="w-full shrink-0 snap-center p-3" aria-label={`View photo ${i + 1} of ${name}`}>
            <img src={img.url} alt={img.alt || name} loading="lazy" className="mx-auto h-56 w-full cursor-zoom-in object-contain" />
          </button>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <div className="flex justify-center gap-1.5 pb-2 sm:hidden">
            {images.map((_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-gold-deep" : "w-1.5 bg-brown/25")} />)}
          </div>
          <div className="hidden gap-2 px-3 pb-3 sm:flex">
            {images.slice(0, 6).map((img, i) => (
              <button key={i} type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1}`} className={cn("h-12 w-12 overflow-hidden rounded-md border-2 bg-card", i === active ? "border-gold" : "border-transparent opacity-70 hover:opacity-100")}>
                <img src={img.url} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        </>
      )}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); setZoom(null); }}>
        <DialogContent className="max-w-5xl bg-card p-3">
          <DialogTitle className="sr-only">{name} photos</DialogTitle>
          <div
            className="relative h-[70vh] overflow-hidden rounded-lg bg-beige"
            onMouseMove={(e) => { if (!zoom) return; const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom(zoom ? null : { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
          >
            <img src={images[active]!.url} alt={images[active]!.alt || name}
              style={zoom ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              className={cn("h-full w-full object-contain transition-transform duration-200", zoom ? "cursor-zoom-out" : "cursor-zoom-in")} />
            {images.length > 1 && (
              <>
                <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setZoom(null); setActive((active - 1 + images.length) % images.length); }} className="absolute top-1/2 left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-xl text-brown shadow">‹</button>
                <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setZoom(null); setActive((active + 1) % images.length); }} className="absolute top-1/2 right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-xl text-brown shadow">›</button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto pt-2">
              {images.map((img, i) => (
                <button key={i} type="button" onClick={() => { setActive(i); setZoom(null); }} className={cn("h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 bg-beige", i === active ? "border-gold" : "border-transparent opacity-70")}>
                  <img src={img.url} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
