import { useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, ShoppingBag, Star, Truck, Zap } from "lucide-react";
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
  if (!product) return null;
  const sameCat = products.filter((p) => p.id !== product.id && p.category?.slug && p.category.slug === product.category?.slug);
  const others = products.filter((p) => p.id !== product.id && !sameCat.includes(p));
  const recommended = [...sameCat, ...others].slice(0, 4) as CatalogProduct[];
  const own = useQuery({ queryKey: ["product-reviews", product?.id], queryFn: () => getProductReviews({ data: { productId: product!.id } }), enabled: Boolean(product) });
  const [open, setOpen] = useState<{ kind: "photo" | "video"; url: string } | null>(null);
  type R = { id: string; name: string; city: string; rating: number; review: string; verified?: boolean; media?: { id: string; kind: "photo" | "video"; url: string }[] };
  const list: R[] = own.data?.length ? own.data : reviews.length ? reviews.map((r) => ({ id: r.id, name: r.customer_name, city: r.city, rating: r.rating, review: r.review }))
    : TESTIMONIALS.map((t, i) => ({ id: String(i), name: t.name, city: t.city, rating: t.rating, review: t.review }));
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 5;

  return (
    <CartProvider>
      <div className="min-h-screen overflow-x-hidden bg-background">
        <Header logoUrl={settings.logoUrl} />
        <main key={product.id} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
          <Link to="/" hash="our-ghee" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to products</Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <VariantView product={product} avg={avg} count={list.length} />
          </div>

          <section className="mt-16" aria-labelledby="reviews-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="reviews-title" className="font-display text-3xl font-semibold text-foreground">Customer reviews</h2>
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1 rounded bg-leaf/12 px-2 py-0.5 font-semibold text-leaf">{avg.toFixed(1)} <Star className="h-3.5 w-3.5 fill-current" /></span>{list.length} reviews</p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.slice(0, 9).map((r) => (
                <article key={r.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex gap-0.5 text-gold">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-current" : "opacity-30")} />)}</div>
                  <p className="mt-3 text-sm leading-6 text-foreground/85">{r.review}</p>
                  {r.media && r.media.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.media.map((m) => (
                        <button key={m.id} type="button" onClick={() => setOpen(m)} aria-label={m.kind === "photo" ? "Open review photo" : "Play review video"} className="h-16 w-16 overflow-hidden rounded-md border border-border bg-secondary">
                          {m.kind === "photo" ? <img src={m.url} alt="Customer photo" loading="lazy" className="h-full w-full object-cover" /> : <video src={m.url} muted preload="metadata" className="h-full w-full object-cover" />}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-sm font-semibold text-foreground">{r.name}{r.city && <span className="font-normal text-muted-foreground"> · {r.city}</span>}{r.verified && <span className="ml-2 rounded bg-leaf/12 px-1.5 py-0.5 text-[10px] font-semibold text-leaf uppercase">Verified buyer</span>}</p>
                </article>
              ))}
            </div>
          </section>

          <Dialog open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
            <DialogContent className="max-w-3xl p-2">
              <DialogTitle className="sr-only">Customer review media</DialogTitle>
              {open?.kind === "photo" && <img src={open.url} alt="Customer photo" className="mx-auto max-h-[80vh] object-contain" />}
              {open?.kind === "video" && <video src={open.url} controls autoPlay className="mx-auto max-h-[80vh] w-full" />}
            </DialogContent>
          </Dialog>

          {recommended.length > 0 && (
            <section className="mt-16" aria-labelledby="rec-title">
              <h2 id="rec-title" className="font-display text-3xl font-semibold text-foreground">You may also like</h2>
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
    <div className="flex flex-col-reverse gap-3 lg:sticky lg:top-24 lg:flex-row lg:self-start">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto lg:flex-col">
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1}`}
              className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-card p-1", i === active ? "border-gold" : "border-border opacity-70 hover:opacity-100")}>
              <img src={img.url} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-gold/30 bg-[radial-gradient(circle_at_50%_40%,var(--color-card)_0%,var(--color-secondary)_100%)] shadow-warm">
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
    </div>
  );
}

function Details({ product, avg, count, variantId, setVariantId }: { product: CatalogProduct; avg: number; count: number; variantId: string; setVariantId: (id: string) => void }) {
  const { addItem, openCart, openCheckout } = useCart();
  const variant = product.product_variants.find((v) => v.id === variantId) ?? product.product_variants[0];
  if (!variant) return null;
  const out = variant.stock <= 0;
  const discount = variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0;
  const add = () => addItem({ productId: product.id, name: product.name, sizeId: variant.id, sizeLabel: variant.label, price: variant.price, quantity: 1, image: imagesFor(product, variant.id)[0]?.url ?? gheeJar });
  return (
    <div>
      {product.category && <p className="text-xs font-semibold tracking-wide text-gold-deep uppercase">{product.category.name}</p>}
      <h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">{product.name}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 rounded bg-leaf/12 px-2 py-0.5 font-semibold text-leaf">{avg.toFixed(1)} <Star className="h-3.5 w-3.5 fill-current" /></span>
        <a href="#reviews-title" className="text-muted-foreground hover:underline">{count} reviews</a>
        <span className="inline-flex items-center gap-1 text-muted-foreground"><BadgeCheck className="h-4 w-4 text-gold-deep" /> Lab tested purity</span>
      </div>
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <span className="font-display text-4xl font-semibold text-foreground">{inr(variant.price)}</span>
        {discount > 0 && <><span className="text-muted-foreground line-through">{inr(variant.mrp)}</span><span className="font-semibold text-leaf">{discount}% off</span></>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
      <div className="mt-6">
        <p className="text-sm font-medium text-foreground">Pack size</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.product_variants.map((v) => (
            <Button key={v.id} variant="outline" size="sm" aria-pressed={v.id === variant.id} onClick={() => setVariantId(v.id)}
              className={cn(v.id === variant.id ? "border-gold bg-gold/12 text-foreground" : "text-foreground/70")}>{v.label}</Button>
          ))}
        </div>
      </div>
      <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Truck className="h-4 w-4 text-leaf" /> Free delivery across India
        {out ? <span className="ml-1 font-semibold text-destructive">Out of stock</span> : variant.stock <= 10 && <span className="ml-1 font-semibold text-destructive">Only {variant.stock} left</span>}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button disabled={out} className="h-12" onClick={() => { add(); openCart(); toast.success("Added to your cart"); }}><ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart</Button>
        <Button variant="purchase" disabled={out} className="h-12" onClick={() => { add(); openCheckout(); }}><Zap className="h-4 w-4" /> Buy Now</Button>
      </div>
      <div className="mt-8 border-t border-border pt-6">
        <h2 className="font-display text-xl font-semibold text-foreground">About this product</h2>
        <p className="mt-3 text-sm leading-7 whitespace-pre-line text-foreground/80">{product.description || product.short_description}</p>
      </div>
    </div>
  );
}

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
