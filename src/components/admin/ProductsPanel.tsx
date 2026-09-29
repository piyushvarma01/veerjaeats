import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, Loader2, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { inr } from "@/lib/shop-data";
import { cn } from "@/lib/utils";
import { ImageManager, type ManagedImage } from "./ImageManager";
import { Confirm, PanelHeader, StatusPill, slugify, uploadProductImage, type AdminCategory, type AdminProduct, type Mutate } from "./shared";

const PAGE_SIZE = 10;
type SortKey = "manual" | "newest" | "oldest" | "name" | "price-asc" | "price-desc" | "stock";

const stockOf = (p: AdminProduct) => p.product_variants.reduce((s, v) => s + v.stock, 0);
const priceOf = (p: AdminProduct) => (p.product_variants.length ? Math.min(...p.product_variants.map((v) => v.price)) : 0);
const imageOf = (p: AdminProduct) => p.product_images.find((i) => i.is_primary)?.image_url ?? p.product_images[0]?.image_url ?? p.image_url;

export function ProductsPanel({ products, categories, mutate }: { products: AdminProduct[]; categories: AdminCategory[]; mutate: Mutate }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  if (editing) {
    const product = editing === "new" ? null : products.find((p) => p.id === editing) ?? null;
    return <ProductEditor key={editing} product={product} categories={categories} mutate={mutate}
      onClose={() => setEditing(null)} onCreated={(id) => setEditing(id)} />;
  }
  return <ProductList products={products} categories={categories} mutate={mutate} onEdit={setEditing} />;
}

function ProductList({ products, categories, mutate, onEdit }: { products: AdminProduct[]; categories: AdminCategory[]; mutate: Mutate; onEdit: (id: string | "new") => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const [sort, setSort] = useState<SortKey>("manual");
  const [page, setPage] = useState(1);
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = products.filter((p) => {
      if (q && !`${p.name} ${p.sku} ${p.slug} ${p.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      if (category !== "all" && (category === "none" ? p.category_id : p.category_id !== category)) return false;
      if (status === "published" && !p.is_active) return false;
      if (status === "draft" && p.is_active) return false;
      if (status === "featured" && !p.is_featured) return false;
      const s = stockOf(p);
      if (stock === "in" && s <= 10) return false;
      if (stock === "low" && (s === 0 || s > 10)) return false;
      if (stock === "out" && s > 0) return false;
      return true;
    });
    const by: Record<SortKey, (a: AdminProduct, b: AdminProduct) => number> = {
      manual: (a, b) => a.sort_order - b.sort_order,
      newest: (a, b) => b.created_at.localeCompare(a.created_at),
      oldest: (a, b) => a.created_at.localeCompare(b.created_at),
      name: (a, b) => a.name.localeCompare(b.name),
      "price-asc": (a, b) => priceOf(a) - priceOf(b),
      "price-desc": (a, b) => priceOf(b) - priceOf(a),
      stock: (a, b) => stockOf(a) - stockOf(b),
    };
    return list.sort(by[sort]);
  }, [products, search, category, status, stock, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const canReorder = sort === "manual" && !search && category === "all" && status === "all" && stock === "all";
  const move = (id: string, dir: -1 | 1) => {
    const ids = [...products].sort((a, b) => a.sort_order - b.sort_order).map((p) => p.id);
    const i = ids.indexOf(id); const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    void mutate({ action: "reorderProducts", ids });
  };

  const actions = (p: AdminProduct) => (
    <div className="flex items-center justify-end gap-1">
      <Button size="icon" variant="ghost" aria-label="View on website" asChild><a href="/#our-ghee" target="_blank" rel="noreferrer"><Eye /></a></Button>
      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => onEdit(p.id)}><Pencil /></Button>
      <Button size="icon" variant="ghost" aria-label="Duplicate" onClick={() => void mutate({ action: "duplicateProduct", id: p.id })}><Copy /></Button>
      <Confirm title={`Delete ${p.name}?`} description="This removes the product, its pack sizes and photos. It cannot be undone." onConfirm={() => void mutate({ action: "deleteProduct", id: p.id })}>
        <Button size="icon" variant="ghost" className="text-destructive" aria-label="Delete"><Trash2 /></Button>
      </Confirm>
    </div>
  );

  return (
    <div className="space-y-5">
      <PanelHeader title="Products" subtitle={`${products.length} products · ${products.filter((p) => p.is_active).length} live on your website`}
        actions={<Button onClick={() => onEdit("new")} className="bg-gold text-brown hover:bg-gold-deep hover:text-cream"><Plus /> Add product</Button>} />

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-warm sm:grid-cols-2 lg:grid-cols-[1fr_repeat(4,170px)]">
        <div className="relative sm:col-span-2 lg:col-span-1"><Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, SKU or tag" className="pl-9" /></div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}><SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem><SelectItem value="none">No category</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="featured">Featured</SelectItem></SelectContent></Select>
        <Select value={stock} onValueChange={(v) => { setStock(v); setPage(1); }}><SelectTrigger aria-label="Stock"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stock</SelectItem><SelectItem value="in">In stock</SelectItem><SelectItem value="low">Low stock (≤10)</SelectItem><SelectItem value="out">Out of stock</SelectItem></SelectContent></Select>
        <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}><SelectTrigger aria-label="Sort"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Website order</SelectItem><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem><SelectItem value="name">Name A–Z</SelectItem><SelectItem value="price-asc">Price low–high</SelectItem><SelectItem value="price-desc">Price high–low</SelectItem><SelectItem value="stock">Lowest stock</SelectItem></SelectContent></Select>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-warm md:block">
        <table className="w-full min-w-[900px] text-left text-sm [&_td]:px-3 [&_th]:px-3">
          <thead className="border-b border-border bg-beige/40 text-xs uppercase text-muted-foreground">
            <tr>{canReorder && <th className="w-12 px-3" />}<th className="px-4 py-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Featured</th><th>Added</th><th className="px-4 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const s = stockOf(p); const img = imageOf(p);
              return (
                <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-beige/25">
                  {canReorder && <td className="px-2"><div className="flex flex-col"><Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Move up" onClick={() => move(p.id, -1)}><ArrowUp /></Button><Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Move down" onClick={() => move(p.id, 1)}><ArrowDown /></Button></div></td>}
                  <td className="px-4 py-3"><button onClick={() => onEdit(p.id)} className="flex items-center gap-3 text-left">
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-beige">{img && <img src={img} alt="" className="h-full w-full object-contain" />}</span>
                    <span><span className="block font-semibold text-brown">{p.name}</span><span className="text-xs text-muted-foreground">{p.sku || p.slug} · {p.product_images.length} photos</span></span>
                  </button></td>
                  <td>{catName(p.category_id)}</td>
                  <td className="font-semibold">{p.product_variants.length ? inr(priceOf(p)) : "—"}</td>
                  <td><span className={cn(s === 0 ? "text-destructive" : s <= 10 ? "text-gold-deep" : "")}>{s}</span></td>
                  <td><Switch checked={p.is_active} aria-label="Published" onCheckedChange={(value) => void mutate({ action: "toggleProduct", id: p.id, value })} /></td>
                  <td><button aria-label="Toggle featured" onClick={() => void mutate({ action: "productFlags", id: p.id, featured: !p.is_featured, bestseller: p.is_bestseller, newArrival: p.is_new_arrival })}><Star className={cn("h-5 w-5", p.is_featured ? "fill-gold text-gold" : "text-muted-foreground")} /></button></td>
                  <td className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4">{actions(p)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="py-14 text-center text-sm text-muted-foreground">No products match your filters</p>}
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((p) => { const img = imageOf(p); return (
          <article key={p.id} className="rounded-xl border border-border bg-card p-3 shadow-warm">
            <div className="flex gap-3">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-beige">{img && <img src={img} alt="" className="h-full w-full object-contain" />}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-brown">{p.name}</p>
                <p className="text-xs text-muted-foreground">{catName(p.category_id)} · Stock {stockOf(p)}</p>
                <p className="mt-1 text-sm font-semibold">{p.product_variants.length ? inr(priceOf(p)) : "—"}</p>
              </div>
              <StatusPill value={p.is_active ? "Live" : "Draft"} tone={p.is_active ? "good" : "muted"} />
            </div>
            <div className="mt-2 border-t border-border pt-2">{actions(p)}</div>
          </article>
        ); })}
        {!rows.length && <p className="py-10 text-center text-sm text-muted-foreground">No products match your filters</p>}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {current} of {pages}</span>
          <Button size="sm" variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

type VariantDraft = { label: string; sku: string; mrp: string; discount: string; stock: string };
const emptyVariant: VariantDraft = { label: "", sku: "", mrp: "", discount: "0", stock: "0" };
const discountOf = (mrp: number, price: number) => (mrp > 0 ? Math.max(0, Math.round(((mrp - price) / mrp) * 100)) : 0);
const priceFrom = (d: VariantDraft) => Math.max(0, Math.round((Number(d.mrp) || 0) * (1 - (Number(d.discount) || 0) / 100)));

function ProductEditor({ product, categories, mutate, onClose, onCreated }: {
  product: AdminProduct | null; categories: AdminCategory[]; mutate: Mutate; onClose: () => void; onCreated: (id: string) => void;
}) {
  const [f, setF] = useState({
    name: product?.name ?? "", shortName: product?.short_name ?? "", slug: product?.slug ?? "", sku: product?.sku ?? "",
    categoryId: product?.category_id ?? null as string | null, shortDescription: product?.short_description ?? "",
    description: product?.description ?? "", weight: product?.weight ?? "", tags: (product?.tags ?? []).join(", "),
    featured: product?.is_featured ?? false, bestseller: product?.is_bestseller ?? false, newArrival: product?.is_new_arrival ?? false,
    seoTitle: product?.seo_title ?? "", seoDescription: product?.seo_description ?? "", seoKeywords: product?.seo_keywords ?? "",
  });
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((prev) => ({ ...prev, [key]: value }));
  const [variants, setVariants] = useState<VariantDraft[]>([{ ...emptyVariant }]);
  const [draftImages, setDraftImages] = useState<ManagedImage[]>([]);
  const [saving, setSaving] = useState(false);

  const liveImages: ManagedImage[] = product
    ? [...product.product_images].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ id: i.id, url: i.image_url, alt: i.alt_text, primary: i.is_primary }))
    : draftImages;
  const primaryUrl = liveImages.find((i) => i.primary)?.url ?? liveImages[0]?.url ?? "";

  const save = async (active: boolean) => {
    if (f.name.trim().length < 2) { alert("Please enter a product name"); return; }
    setSaving(true);
    const fields = {
      name: f.name.trim(), shortName: (f.shortName || f.name).trim().slice(0, 60), slug: slugify(f.slug || f.name), sku: f.sku.trim(),
      categoryId: f.categoryId, shortDescription: f.shortDescription.trim(), description: f.description.trim(), weight: f.weight.trim(),
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20), imageUrl: primaryUrl, active,
      featured: f.featured, bestseller: f.bestseller, newArrival: f.newArrival,
      seoTitle: f.seoTitle.trim(), seoDescription: f.seoDescription.trim(), seoKeywords: f.seoKeywords.trim(),
    };
    const res = product
      ? await mutate({ action: "editProduct", id: product.id, ...fields })
      : await mutate({
        action: "addProduct", ...fields,
        variants: variants.map((v) => ({ label: v.label.trim(), sku: v.sku.trim(), mrp: Number(v.mrp) || 0, discount: Number(v.discount) || 0, stock: Number(v.stock) || 0 })),
        images: [...draftImages].sort((a, b) => Number(b.primary) - Number(a.primary)).map((i) => ({ imageUrl: i.url, altText: i.alt })),
      });
    setSaving(false);
    if (res?.ok) { if (!product && res.id) onCreated(res.id); else onClose(); }
  };

  const imageHandlers = product ? {
    onUpload: async (files: File[]) => {
      const urls = (await Promise.all(files.map(uploadProductImage))).filter((u): u is string => Boolean(u));
      if (urls.length) await mutate({ action: "addProductImages", productId: product.id, images: urls.map((imageUrl) => ({ imageUrl, altText: product.name })) });
    },
    onReorder: (ids: string[]) => void mutate({ action: "reorderProductImages", productId: product.id, ids }),
    onPrimary: (id: string) => void mutate({ action: "setPrimaryImage", productId: product.id, id }),
    onDelete: (id: string) => void mutate({ action: "deleteProductImage", id }),
    onAlt: (id: string, altText: string) => void mutate({ action: "updateProductImage", id, altText }),
    onReplace: async (id: string, file: File) => {
      const url = await uploadProductImage(file);
      const current = liveImages.find((i) => i.id === id);
      if (url) await mutate({ action: "updateProductImage", id, altText: current?.alt ?? "", imageUrl: url });
    },
  } : {
    onUpload: async (files: File[]) => {
      const urls = (await Promise.all(files.map(uploadProductImage))).filter((u): u is string => Boolean(u));
      setDraftImages((prev) => [...prev, ...urls.map((url, i) => ({ id: crypto.randomUUID(), url, alt: "", primary: prev.length === 0 && i === 0 }))]);
    },
    onReorder: (ids: string[]) => setDraftImages((prev) => ids.map((id) => prev.find((i) => i.id === id)!)),
    onPrimary: (id: string) => setDraftImages((prev) => prev.map((i) => ({ ...i, primary: i.id === id }))),
    onDelete: (id: string) => setDraftImages((prev) => { const next = prev.filter((i) => i.id !== id); if (next.length && !next.some((i) => i.primary)) next[0] = { ...next[0]!, primary: true }; return next; }),
    onAlt: (id: string, alt: string) => setDraftImages((prev) => prev.map((i) => (i.id === id ? { ...i, alt } : i))),
    onReplace: async (id: string, file: File) => { const url = await uploadProductImage(file); if (url) setDraftImages((prev) => prev.map((i) => (i.id === id ? { ...i, url } : i))); },
  };

  const field = (id: string, label: string, node: React.ReactNode, hint?: string) => (
    <div><Label htmlFor={id}>{label}</Label>{node}{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={onClose}><ArrowLeft /> All products</Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl font-semibold text-brown">{product ? product.name : "New product"}</h2>
          {product && <StatusPill value={product.is_active ? "Published" : "Draft"} tone={product.is_active ? "good" : "muted"} />}
        </div>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="outline" onClick={() => void save(false)} disabled={saving}>Save draft</Button>
        <Button onClick={() => void save(true)} disabled={saving} className="bg-leaf text-accent-foreground hover:bg-leaf/90">{saving && <Loader2 className="animate-spin" />}Publish</Button>
      </div>

      <Tabs defaultValue="basic" className="rounded-xl border border-border bg-card p-4 shadow-warm sm:p-6">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & stock</TabsTrigger>
          <TabsTrigger value="images">Photos ({liveImages.length})</TabsTrigger>
          <TabsTrigger value="info">Product info</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6 grid gap-4 lg:grid-cols-2">
          {field("pe-name", "Product name", <Input id="pe-name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Organic Groundnut Oil" />)}
          {field("pe-short", "Short name", <Input id="pe-short" value={f.shortName} onChange={(e) => set("shortName", e.target.value)} placeholder="Groundnut Oil" />, "Used in the cart and small spaces")}
          {field("pe-sku", "Product SKU", <Input id="pe-sku" value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder="VE-GNO" />)}
          <div><Label>Category</Label>
            <Select value={f.categoryId ?? "none"} onValueChange={(v) => set("categoryId", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">No category</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {field("pe-slug", "Web address name", <Input id="pe-slug" value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(f.name) || "organic-groundnut-oil"} />, "Leave blank to create it from the name")}
          <div className="lg:col-span-2">{field("pe-sdesc", "Short description", <Textarea id="pe-sdesc" rows={2} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={300} />)}</div>
          <div className="lg:col-span-2">{field("pe-desc", "Full description", <Textarea id="pe-desc" rows={6} value={f.description} onChange={(e) => set("description", e.target.value)} />)}</div>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground">Each pack size has its own MRP, discount and stock.</p>
          {product ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {product.product_variants.map((v) => <VariantEditor key={v.id} variant={v} mutate={mutate} />)}
              <AddVariant productId={product.id} mutate={mutate} />
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((v, i) => (
                <div key={i} className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-3 flex items-center justify-between"><strong className="text-sm text-brown">Pack size {i + 1}</strong>
                    {variants.length > 1 && <Button type="button" size="icon" variant="ghost" aria-label="Remove pack size" onClick={() => setVariants(variants.filter((_, j) => j !== i))}><Trash2 /></Button>}</div>
                  <VariantFields value={v} onChange={(next) => setVariants(variants.map((x, j) => (j === i ? next : x)))} idPrefix={`nv-${i}`} />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setVariants([...variants, { ...emptyVariant }])}><Plus /> Add pack size</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <ImageManager images={liveImages} {...imageHandlers} />
          {!product && <p className="mt-3 text-xs text-muted-foreground">Photos are saved with the product when you click Save draft or Publish.</p>}
        </TabsContent>

        <TabsContent value="info" className="mt-6 grid gap-4 lg:grid-cols-2">
          {field("pe-weight", "Unit / weight", <Input id="pe-weight" value={f.weight} onChange={(e) => set("weight", e.target.value)} placeholder="1 litre" />)}
          {field("pe-tags", "Product tags", <Input id="pe-tags" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="cold pressed, organic" />, "Separate tags with commas")}
        </TabsContent>

        <TabsContent value="seo" className="mt-6 grid gap-4">
          {field("pe-seot", "Search engine title", <Input id="pe-seot" value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={120} placeholder={f.name} />, `${f.seoTitle.length}/120`)}
          {field("pe-seod", "Search engine description", <Textarea id="pe-seod" rows={3} value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={300} />, `${f.seoDescription.length}/300`)}
          {field("pe-seok", "Search keywords", <Input id="pe-seok" value={f.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} maxLength={300} placeholder="a2 ghee, bilona ghee" />)}
        </TabsContent>

        <TabsContent value="publishing" className="mt-6 space-y-4">
          {([["featured", "Featured product", "Highlighted first on the website"], ["bestseller", "Bestseller", "Shows a Bestseller badge"], ["newArrival", "New arrival", "Shows a New badge"]] as const).map(([key, label, hint]) => (
            <label key={key} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
              <span><span className="block font-medium text-brown">{label}</span><span className="text-xs text-muted-foreground">{hint}</span></span>
              <Switch checked={f[key]} onCheckedChange={(v) => set(key, v)} />
            </label>
          ))}
          <p className="text-sm text-muted-foreground">Use <strong>Save draft</strong> to keep it hidden, or <strong>Publish</strong> to show it on your website.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VariantFields({ value, onChange, idPrefix }: { value: VariantDraft; onChange: (next: VariantDraft) => void; idPrefix: string }) {
  const price = priceFrom(value); const discount = Number(value.discount) || 0;
  const input = (key: keyof VariantDraft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><Label htmlFor={`${idPrefix}-${key}`} className="text-xs">{label}</Label><Input id={`${idPrefix}-${key}`} value={value[key]} onChange={(e) => onChange({ ...value, [key]: e.target.value })} {...props} /></div>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {input("label", "Pack size", { placeholder: "500 ml" })}
      {input("sku", "SKU", { placeholder: "VE-A2-500" })}
      {input("mrp", "MRP (₹)", { type: "number", min: 1 })}
      {input("discount", "Discount (%)", { type: "number", min: 0, max: 90 })}
      {input("stock", "Stock", { type: "number", min: 0 })}
      <p className="self-end text-sm text-muted-foreground">Sells at <strong className="text-brown">{inr(price)}</strong>{discount > 0 && <span className="ml-1 text-gold-deep">({discount}% off)</span>}</p>
    </div>
  );
}

function VariantEditor({ variant, mutate }: { variant: AdminProduct["product_variants"][number]; mutate: Mutate }) {
  const [d, setD] = useState<VariantDraft>({ label: variant.label, sku: variant.sku, mrp: String(variant.mrp), discount: String(discountOf(variant.mrp, variant.price)), stock: String(variant.stock) });
  const price = priceFrom(d);
  const save = (active: boolean) => void mutate({ action: "updateVariant", id: variant.id, price, mrp: Number(d.mrp) || 0, stock: Number(d.stock) || 0, active });
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <div><strong className="text-brown">{variant.label}</strong><p className="text-xs text-muted-foreground">{variant.sku}</p></div>
        <div className="flex items-center gap-1">
          <StatusPill value={variant.is_active ? "Active" : "Hidden"} tone={variant.is_active ? "good" : "muted"} />
          <Confirm title={`Delete pack size ${variant.label}?`} description="This pack size will be removed." onConfirm={() => void mutate({ action: "deleteVariant", id: variant.id })}>
            <Button size="icon" variant="ghost" aria-label="Delete pack size"><Trash2 /></Button>
          </Confirm>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div><Label className="text-xs">MRP</Label><Input type="number" value={d.mrp} onChange={(e) => setD({ ...d, mrp: e.target.value })} /></div>
        <div><Label className="text-xs">Discount %</Label><Input type="number" min={0} max={90} value={d.discount} onChange={(e) => setD({ ...d, discount: e.target.value })} /></div>
        <div><Label className="text-xs">Stock</Label><Input type="number" value={d.stock} onChange={(e) => setD({ ...d, stock: e.target.value })} /></div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Sells at <strong className="text-brown">{inr(price)}</strong></p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => save(variant.is_active)}>Save</Button>
        <Button size="sm" variant="outline" onClick={() => save(!variant.is_active)}>{variant.is_active ? "Hide" : "Show"}</Button>
      </div>
    </div>
  );
}

function AddVariant({ productId, mutate }: { productId: string; mutate: Mutate }) {
  const [open, setOpen] = useState(false); const [d, setD] = useState<VariantDraft>({ ...emptyVariant });
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="grid min-h-[140px] place-items-center rounded-lg border border-dashed border-border bg-background text-sm font-medium text-gold-deep hover:bg-beige/40"><span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add pack size</span></button>;
  return (
    <div className="rounded-lg border border-border bg-background p-4 lg:col-span-3">
      <VariantFields idPrefix={`av-${productId}`} value={d} onChange={setD} />
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={async () => { const r = await mutate({ action: "addVariant", productId, label: d.label.trim(), sku: d.sku.trim(), mrp: Number(d.mrp) || 0, discount: Number(d.discount) || 0, stock: Number(d.stock) || 0 }); if (r?.ok) { setD({ ...emptyVariant }); setOpen(false); } }}>Save pack size</Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
