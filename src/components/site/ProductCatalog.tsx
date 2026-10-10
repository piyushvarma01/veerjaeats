import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Search, Package, ShoppingBag, Star, Truck, Zap } from "lucide-react";
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
  short_description?: string;
  images?: { url: string; alt: string; variantId?: string | null }[];
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

const productText = (p: CatalogProduct) => `${p.name} ${p.short_name} ${p.description} ${p.category?.name ?? ""}`.toLowerCase();
const GROUPS: { slug: string; name: string; test: RegExp }[] = [
  { slug: "ghee", name: "Ghee", test: /ghee/ },
  { slug: "khapli-aata", name: "Khapli Aata", test: /khapli|atta|aata|flour/ },
  { slug: "isabgol", name: "Isabgol", test: /isabgol|psyllium/ },
  { slug: "powders", name: "Powders", test: /powder/ },
];
export function matchesCategory(p: CatalogProduct, cat: string) {
  if (cat === "all" || p.category?.slug === cat) return true;
  const group = GROUPS.find((g) => g.slug === cat);
  return Boolean(group && group.test.test(productText(p)));
}

export function ProductCatalog({ products }: { products: CatalogProduct[] }) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; slug: string; sort_order: number }>();
    products.forEach((p) => p.category && map.set(p.category.slug, p.category));
    return [...map.values()].sort((a, b) => a.sort_order - b.sort_order);
  }, [products]);

  const sorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = products.filter((p) => {
      return matchesCategory(p, cat) && (!query || productText(p).includes(query));
    });
    if (sort === "featured") list.sort((a, b) => Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)));
    const best = (product: CatalogProduct): Variant => product.product_variants[0] ?? { id: "", label: "", price: 0, mrp: 0, stock: 0 };
    if (sort === "price-asc") list.sort((a, b) => best(a).price - best(b).price);
    if (sort === "price-desc") list.sort((a, b) => best(b).price - best(a).price);
    if (sort === "discount") list.sort((a, b) => discountOf(best(b)) - discountOf(best(a)));
    return list;
  }, [products, sort, cat, search]);

  return (
    <section id="our-ghee" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <SectionHeading
        eyebrow="The Veerja pantry"
        title="Our Products"
      />

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]" role="tablist" aria-label="Browse categories">
        {[{ slug: "all", name: "All products" }, ...GROUPS, ...categories.filter((c) => !GROUPS.some((g) => g.slug === c.slug))].map((c) => {
          const count = products.filter((p) => matchesCategory(p, c.slug)).length;
          return (
            <button key={c.slug} type="button" role="tab" aria-selected={cat === c.slug} onClick={() => setCat(c.slug)}
              className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors", cat === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-gold")}>
              {c.name} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-4 border-y border-border bg-secondary/40 py-5 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute top-3.5 left-3.5 h-5 w-5 text-muted-foreground" />
          <input type="search" aria-label="Search products" placeholder="Search products…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-card pr-4 pl-11 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select aria-label="Product category" value={cat} onChange={(e) => setCat(e.target.value)} className="h-12 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:ring-2 focus:ring-ring">
          <option value="all">All categories</option>
          <option value="ghee">Ghee</option>
          <option value="khapli-aata">Khapli Aata</option>
          <option value="isabgol">Isabgol</option>
          <option value="powders">Powders</option>
          {categories.filter((c) => !["ghee", "khapli-aata", "isabgol", "powders"].includes(c.slug)).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-12 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:ring-2 focus:ring-ring">
          {SORTS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <Package className="h-4 w-4 text-leaf" /> {sorted.length} {sorted.length === 1 ? "product" : "products"}
      </p>
      {sorted.length === 0 && <div className="py-16 text-center">
        <p className="text-lg font-medium text-foreground">No products found</p>
        <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCat("all"); }}>Clear filters</Button>
      </div>}

      <Reveal className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  const [variantId, setVariantId] = useState(product.product_variants[0]?.id ?? "");
  const variant =
    product.product_variants.find((item) => item.id === variantId) ?? product.product_variants[0];
  if (!variant) return null;
  const discount = discountOf(variant);
  const gallery = product.images?.length ? product.images : [{ url: product.image_url ?? gheeJar, alt: product.name }];
  const image = gallery[0]?.url ?? gheeJar;
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
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-warm">
      <div className="relative overflow-hidden bg-card">
        <ProductGallery images={gallery} name={product.name} slug={product.slug} />
        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-leaf px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            {discount}% off
          </span>
        )}
        <div className="pointer-events-none absolute top-3 right-3 flex flex-col items-end gap-1">
          {product.is_featured && <span className="rounded-md bg-gold px-2.5 py-1 text-xs font-semibold text-primary-foreground">Featured</span>}
          {product.is_bestseller && <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-brown">Bestseller</span>}
          {product.is_new_arrival && <span className="rounded-full bg-brown px-2.5 py-1 text-xs font-semibold text-cream">New</span>}
        </div>
        {outOfStock && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-brown/55 text-sm font-semibold text-cream">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-leaf/12 px-1.5 py-0.5 text-xs font-semibold text-leaf">
            4.9 <Star className="h-3 w-3 fill-current" />
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5 text-gold-deep" /> Lab tested purity
          </span>
        </div>

        <h3 className="mt-2 font-display text-xl font-semibold text-foreground"><Link to="/product/$slug" params={{ slug: product.slug }} className="hover:text-gold-deep">{product.name}</Link></h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{product.short_description || product.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {product.product_variants.map((item) => (
            <Button variant="outline" size="sm"
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
            </Button>
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

        <div className="mt-auto grid grid-cols-1 gap-2 pt-5">
          <Button
            disabled={outOfStock}
            onClick={() => {
              add();
              openCart();
              toast.success("Added to your cart", {
                description: `1 × ${product.short_name} (${variant.label})`,
              });
            }}
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
          </Button>
          <Button
            variant="purchase"
            disabled={outOfStock}
            onClick={() => {
              add();
              openCheckout();
            }}
            className="h-11 w-full"
          >
            <Zap className="h-4 w-4" /> Buy Now
          </Button>
        </div>
      </div>
    </article>
  );
}

function ProductGallery({ images, name, slug }: { images: { url: string; alt: string }[]; name: string; slug: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <Link to="/product/$slug" params={{ slug }} className="block aspect-square w-full p-4" aria-label={`Open ${name}`}>
        <img src={images[active]?.url} alt={images[active]?.alt || name} loading="lazy" width={2500} height={2500} className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.02]" />
      </Link>
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {images.slice(0, 6).map((_, i) => (
            <button key={i} type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-gold-deep" : "w-1.5 bg-brown/25")} />
          ))}
        </div>
      )}
    </div>
  );
}
