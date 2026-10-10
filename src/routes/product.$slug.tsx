import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Camera, Heart, Leaf, Mail, Minus, PackageCheck, Phone, Plus, ShieldCheck, ShoppingBag, Star, Truck, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider, useCart } from "@/lib/cart-context";
import { inr, TESTIMONIALS } from "@/lib/shop-data";
import { cn } from "@/lib/utils";
import gheeJar from "@/assets/ghee-jar.jpg";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { Checkout } from "@/components/site/Checkout";
import { OrderSuccess } from "@/components/site/OrderSuccess";
import type { CatalogProduct } from "@/components/site/ProductCatalog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getProductReviews } from "@/lib/reviews.functions";
import { useQuery } from "@tanstack/react-query";
import { getApprovedReviews, getSiteSettings, getStorefrontProducts } from "@/lib/storefront.functions";

const productsQuery = queryOptions({ queryKey: ["storefront-products"], queryFn: () => getStorefrontProducts() });
const reviewsQuery = queryOptions({ queryKey: ["storefront-reviews"], queryFn: () => getApprovedReviews() });
const settingsQuery = queryOptions({ queryKey: ["storefront-settings"], queryFn: () => getSiteSettings() });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const [products] = await Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(reviewsQuery),
      context.queryClient.ensureQueryData(settingsQuery),
    ]);
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { name: product.name, description: product.short_description || product.description };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} | Veerja Eats` : "Product | Veerja Eats";
    const description = (loaderData?.description || "Pure, traditional food from Veerja Eats.").slice(0, 160);
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div><h1 className="font-display text-3xl text-foreground">Product not found</h1>
        <Link to="/" className="mt-4 inline-block text-gold-deep underline">Back to shop</Link></div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: reviews } = useSuspenseQuery(reviewsQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const product = products.find((p) => p.slug === slug) as CatalogProduct | undefined;
  const own = useQuery({ queryKey: ["product-reviews", product?.id], queryFn: () => getProductReviews({ data: { productId: product!.id } }), enabled: Boolean(product) });
  const [open, setOpen] = useState<{ kind: "photo" | "video"; url: string } | null>(null);
  if (!product) return null;
  const sameCat = products.filter((p) => p.id !== product.id && p.category?.slug && p.category.slug === product.category?.slug);
  const others = products.filter((p) => p.id !== product.id && !sameCat.includes(p));
  const recommended = [...sameCat, ...others].slice(0, 4) as CatalogProduct[];

  const list: ReviewItem[] = own.data?.length ? own.data : reviews.length ? reviews.map((r) => ({ id: r.id, name: r.customer_name, city: r.city, rating: r.rating, review: r.review }))
    : TESTIMONIALS.map((t, i) => ({ id: String(i), name: t.name, city: t.city, rating: t.rating, review: t.review }));
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 5;

  return (
    <CartProvider>
      <div className="min-h-screen overflow-x-hidden bg-background">
        <Header logoUrl={settings.logoUrl} />
        <main key={product.id} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
          <Link to="/" hash="our-ghee" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to products</Link>
          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <VariantView product={product} avg={avg} count={list.length} />
          </div>

          <InfoSections product={product} />

          <ReviewsSection list={list} avg={avg} onOpen={setOpen} />

          <Dialog open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
            <DialogContent className="max-w-3xl p-2">
              <DialogTitle className="sr-only">Customer review media</DialogTitle>
              {open?.kind === "photo" && <img src={open.url} alt="Customer photo" className="mx-auto max-h-[80vh] object-contain" />}
              {open?.kind === "video" && <video src={open.url} controls autoPlay className="mx-auto max-h-[80vh] w-full" />}
            </DialogContent>
          </Dialog>

          {recommended.length > 0 && (
            <section className="mt-14" aria-labelledby="rec-title">
              <h2 id="rec-title" className="font-display text-2xl font-semibold text-foreground sm:text-3xl">You may also like</h2>
              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {recommended.map((p) => <Recommendation key={p.id} product={p} />)}
              </div>
            </section>
          )}
        </main>
        <Footer logoUrl={settings.logoUrl} />
        <CartDrawer />
        <Checkout />
        <OrderSuccess />
        <Toaster position="bottom-right" />
      </div>
    </CartProvider>
  );
}

type ReviewItem = { id: string; name: string; city: string; rating: number; review: string; verified?: boolean; media?: { id: string; kind: "photo" | "video"; url: string }[] };

type Img = { url: string; alt: string; variantId?: string | null };
function imagesFor(product: CatalogProduct, variantId: string) {
  const all = imagesOf(product) as Img[];
  const own = all.filter((i) => i.variantId === variantId);
  const shared = all.filter((i) => !i.variantId);
  const list = [...own, ...shared];
  return list.length ? list : [{ url: product.image_url ?? gheeJar, alt: product.name }];
}

function imagesOf(product: CatalogProduct) {
  return product.images?.length ? product.images : [{ url: product.image_url ?? gheeJar, alt: product.name }];
}

function VariantView({ product, avg, count }: { product: CatalogProduct; avg: number; count: number }) {
  const [variantId, setVariantId] = useState(product.product_variants[0]?.id ?? "");
  return (
    <>
      <Gallery key={variantId} product={product} images={imagesFor(product, variantId)} />
      <Details product={product} avg={avg} count={count} variantId={variantId} setVariantId={setVariantId} />
    </>
  );
}

function Gallery({ product, images }: { product: CatalogProduct; images: Img[] }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (i: number) => {
    setActive(i);
    track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
      <div className="relative min-w-0 overflow-hidden rounded-2xl border border-gold/30 bg-[radial-gradient(circle_at_50%_40%,var(--color-card)_0%,var(--color-secondary)_100%)] shadow-warm">
        <div ref={track} onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== active) setActive(i); }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <div key={i} className="aspect-square w-full shrink-0 snap-center p-2 sm:p-3">
              <img src={img.url} alt={img.alt || product.name} width={2500} height={2500} className="h-full w-full scale-[1.04] object-contain drop-shadow-xl" />
            </div>
          ))}
        </div>
        <span className="pointer-events-none absolute top-3 left-3 rounded-full border border-gold/40 bg-background/80 px-3 py-1 text-[11px] font-semibold tracking-wider text-gold-deep uppercase backdrop-blur">Pure · Lab tested</span>
        {images.length > 1 && <span className="absolute right-3 bottom-3 rounded-full bg-background/85 px-2.5 py-1 text-xs text-foreground">{active + 1} / {images.length}</span>}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1}`}
              className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-card p-1 sm:h-[72px] sm:w-[72px]", i === active ? "border-gold" : "border-border opacity-70 hover:opacity-100")}>
              <img src={img.url} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Details({ product, avg, count, variantId, setVariantId }: { product: CatalogProduct; avg: number; count: number; variantId: string; setVariantId: (id: string) => void }) {
  const { addItem, openCart, openCheckout } = useCart();
  const [qty, setQty] = useState(1);
  const variant = product.product_variants.find((v) => v.id === variantId) ?? product.product_variants[0];
  if (!variant) return null;
  const out = variant.stock <= 0;
  const maxQty = Math.max(1, Math.min(variant.stock, 10));
  const quantity = Math.min(qty, maxQty);
  const pct = (v: { mrp: number; price: number }) => (v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0);
  const discount = pct(variant);
  const add = () => addItem({ productId: product.id, name: product.name, sizeId: variant.id, sizeLabel: variant.label, price: variant.price, quantity, image: imagesFor(product, variant.id)[0]?.url ?? gheeJar });
  return (
    <div>
      {product.category && <p className="text-xs font-semibold tracking-wide text-gold-deep uppercase">{product.category.name}</p>}
      <h1 className="mt-1.5 font-display text-2xl font-semibold text-foreground sm:text-4xl">{product.name}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1 rounded bg-leaf/12 px-2 py-0.5 font-semibold text-leaf">{avg.toFixed(1)} <Star className="h-3.5 w-3.5 fill-current" /></span>
        <a href="#reviews-title" className="text-muted-foreground hover:underline">({count} reviews)</a>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <span className="font-display text-4xl font-semibold text-leaf">{inr(variant.price)}</span>
        {discount > 0 && <span className="pb-1 text-muted-foreground line-through">{inr(variant.mrp)}</span>}
        {discount > 0 && <span className="mb-1 rounded bg-leaf/12 px-2 py-0.5 text-xs font-bold text-leaf">{discount}% off</span>}
      </div>
      {discount > 0 && <p className="mt-1 text-sm font-medium text-leaf">You save {inr(variant.mrp - variant.price)} per pack</p>}
      <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes · Free delivery</p>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[{ Icon: ShieldCheck, t: "Lab tested", s: "Quality assured" }, { Icon: Heart, t: "Healthy", s: "Pure & traditional" }, { Icon: Leaf, t: "Natural", s: "No shortcuts" }].map(({ Icon, t, s }) => (
          <div key={t} className="rounded-lg border border-border bg-card px-2 py-3">
            <Icon className="mx-auto h-5 w-5 text-gold-deep" />
            <p className="mt-1 text-xs font-semibold text-foreground">{t}</p>
            <p className="text-[11px] text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-foreground">Select option</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {product.product_variants.map((v) => {
            const d = pct(v); const selected = v.id === variant.id;
            return (
              <button key={v.id} type="button" aria-pressed={selected} onClick={() => { setVariantId(v.id); setQty(1); }}
                className={cn("relative rounded-lg border-2 p-3 text-left transition-colors", selected ? "border-gold bg-gold/10" : "border-border bg-card hover:border-gold/50")}>
                {d > 0 && <span className="absolute -top-2 right-2 rounded bg-leaf px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{d}% off</span>}
                <span className="block text-sm font-semibold text-foreground">{v.label}</span>
                <span className="mt-0.5 block text-sm font-semibold text-leaf">{inr(v.price)}</span>
                {d > 0 && <span className="block text-xs text-muted-foreground line-through">{inr(v.mrp)}</span>}
                {v.stock <= 0 && <span className="block text-[11px] font-semibold text-destructive">Out of stock</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">Quantity</span>
          <div className="inline-flex items-center rounded-lg border border-border bg-card">
            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQty(quantity - 1)} className="grid h-10 w-10 place-items-center text-foreground disabled:opacity-40"><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
            <button type="button" aria-label="Increase quantity" disabled={out || quantity >= maxQty} onClick={() => setQty(quantity + 1)} className="grid h-10 w-10 place-items-center text-foreground disabled:opacity-40"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Truck className="h-4 w-4 text-leaf" />
          {out ? <span className="font-semibold text-destructive">Out of stock</span> : variant.stock <= 10 ? <span className="font-semibold text-destructive">Only {variant.stock} left</span> : <span>In stock</span>}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" disabled={out} className="h-12 border-gold text-foreground" onClick={() => { add(); openCart(); toast.success("Added to your cart"); }}><ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart</Button>
        <Button variant="purchase" disabled={out} className="h-12" onClick={() => { add(); openCheckout(); }}><Zap className="h-4 w-4" /> Buy Now</Button>
      </div>
    </div>
  );
}

function InfoSections({ product }: { product: CatalogProduct }) {
  const features = product.tags ?? [];
  const specs: [string, string][] = [
    ["Category", product.category?.name ?? ""], ["Unit / weight", product.weight ?? ""],
    ["Available pack sizes", product.product_variants.map((v) => v.label).join(", ")],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5" aria-label="Product information">
      <Accordion type="multiple" defaultValue={["desc"]} className="rounded-xl border border-border bg-card px-4 lg:col-span-3 lg:self-start">
        <AccordionItem value="desc"><AccordionTrigger className="font-semibold">Product description</AccordionTrigger>
          <AccordionContent><p className="text-sm leading-7 whitespace-pre-line text-foreground/80">{product.description || product.short_description || "Details coming soon."}</p></AccordionContent></AccordionItem>
        <AccordionItem value="features"><AccordionTrigger className="font-semibold">Key features</AccordionTrigger>
          <AccordionContent>
            <ul className="grid gap-2 text-sm text-foreground/80">
              {["Lab tested for purity", "Traditional, carefully made", ...features].map((f) => <li key={f} className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" /><span className="capitalize">{f}</span></li>)}
            </ul>
          </AccordionContent></AccordionItem>
        <AccordionItem value="specs" className="border-b-0"><AccordionTrigger className="font-semibold">Product specifications</AccordionTrigger>
          <AccordionContent>
            <dl className="divide-y divide-border text-sm">
              {specs.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium text-foreground">{v}</dd></div>)}
            </dl>
          </AccordionContent></AccordionItem>
      </Accordion>

      <div className="grid gap-4 lg:col-span-2 lg:self-start">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Truck className="h-4 w-4 text-leaf" /> Shipping &amp; delivery</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-gold-deep" /> Free delivery across India</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold-deep" /> Securely packed to arrive fresh</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Phone className="h-4 w-4 text-leaf" /> Customer support</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <a href="tel:+919000000000" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Phone className="h-4 w-4 text-gold-deep" /> +91 90000 00000</a>
            <a href="mailto:hello@veerjaeats.com" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><Mail className="h-4 w-4 text-gold-deep" /> hello@veerjaeats.com</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewsSection({ list, avg, onOpen }: { list: ReviewItem[]; avg: number; onOpen: (m: { kind: "photo" | "video"; url: string }) => void }) {
  const [sort, setSort] = useState<"newest" | "high" | "low">("newest");
  const [photosOnly, setPhotosOnly] = useState(false);
  const [shown, setShown] = useState(6);
  const counts = useMemo(() => [5, 4, 3, 2, 1].map((n) => list.filter((r) => r.rating === n).length), [list]);
  const recommend = list.length ? Math.round((list.filter((r) => r.rating >= 4).length / list.length) * 100) : 0;
  const visible = useMemo(() => {
    const base = photosOnly ? list.filter((r) => r.media?.length) : list;
    if (sort === "high") return [...base].sort((a, b) => b.rating - a.rating);
    if (sort === "low") return [...base].sort((a, b) => a.rating - b.rating);
    return base;
  }, [list, sort, photosOnly]);
  const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <section className="mt-14 rounded-xl border border-border bg-card p-4 sm:p-6" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Customer reviews</h2>
      <p className="mt-1 text-sm text-muted-foreground">{list.length} reviews</p>
      <div className="mt-5 grid grid-cols-1 gap-6 rounded-xl border border-border bg-background p-4 sm:grid-cols-[200px_1fr] sm:p-6">
        <div>
          <p className="font-display text-5xl font-semibold text-foreground">{avg.toFixed(1)}</p>
          <div className="mt-1 flex gap-0.5 text-gold">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-4 w-4", i < Math.round(avg) ? "fill-current" : "opacity-30")} />)}</div>
          <p className="mt-1 text-xs text-muted-foreground">Based on {list.length} reviews</p>
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-leaf/12 px-3 py-1 text-xs font-semibold text-leaf"><ThumbIcon /> {recommend}% recommend</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Rating breakdown</p>
          <div className="mt-2 grid gap-1.5">
            {[5, 4, 3, 2, 1].map((n, i) => {
              const c = counts[i] ?? 0; const w = list.length ? (c / list.length) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex w-6 items-center gap-0.5">{n}<Star className="h-3 w-3 fill-current text-gold" /></span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gold" style={{ width: `${w}%` }} /></div>
                  <span className="w-14 text-right">{c} ({Math.round(w)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="review-sort">Sort reviews</label>
        <select id="review-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
          <option value="newest">Most recent</option><option value="high">Highest rating</option><option value="low">Lowest rating</option>
        </select>
        <button type="button" aria-pressed={photosOnly} onClick={() => setPhotosOnly((v) => !v)}
          className={cn("inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm", photosOnly ? "border-gold bg-gold/12 text-foreground" : "border-border bg-background text-muted-foreground")}><Camera className="h-4 w-4" /> With photos &amp; videos</button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {visible.slice(0, shown).map((r) => (
          <article key={r.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf/15 text-sm font-semibold text-leaf">{initials(r.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{r.name}{r.verified && <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] font-semibold text-leaf"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>}</p>
                {r.city && <p className="text-xs text-muted-foreground">{r.city}</p>}
              </div>
              <div className="flex gap-0.5 text-gold">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-current" : "opacity-30")} />)}</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground/85">{r.review}</p>
            {r.media && r.media.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.media.map((m) => (
                  <button key={m.id} type="button" onClick={() => onOpen(m)} aria-label={m.kind === "photo" ? "Open review photo" : "Play review video"} className="h-16 w-16 overflow-hidden rounded-md border border-border bg-secondary">
                    {m.kind === "photo" ? <img src={m.url} alt="Customer photo" loading="lazy" className="h-full w-full object-cover" /> : <video src={m.url} muted preload="metadata" className="h-full w-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      {visible.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No reviews with photos or videos yet.</p>}
      {visible.length > shown && <div className="mt-5 text-center"><Button variant="outline" onClick={() => setShown((n) => n + 6)}>Show more reviews</Button></div>}
    </section>
  );
}

function ThumbIcon() { return <ShieldCheck className="h-3.5 w-3.5" />; }

function Recommendation({ product }: { product: CatalogProduct }) {
  const v = product.product_variants[0];
  const img = imagesOf(product)[0];
  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-warm">
      <div className="aspect-square p-4"><img src={img?.url} alt={img?.alt || product.name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-[1.03]" /></div>
      <div className="p-4 pt-0">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</p>
        {v && <p className="mt-1 text-sm"><span className="font-semibold text-foreground">{inr(v.price)}</span>{v.mrp > v.price && <span className="ml-2 text-xs text-muted-foreground line-through">{inr(v.mrp)}</span>}</p>}
      </div>
    </Link>
  );
}
