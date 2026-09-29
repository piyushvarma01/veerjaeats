import { useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Confirm, PanelHeader, StatusPill, slugify, uploadProductImage, type AdminCategory, type AdminProduct, type Mutate } from "./shared";

export function CategoriesPanel({ categories, products, mutate }: { categories: AdminCategory[]; products: AdminProduct[]; mutate: Mutate }) {
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const move = (from: number, to: number) => {
    const ids = categories.map((c) => c.id);
    const [m] = ids.splice(from, 1); ids.splice(to, 0, m!);
    void mutate({ action: "reorderCategories", ids });
  };
  return (
    <div className="space-y-5">
      <PanelHeader title="Categories" subtitle="Group your products. Products appear on the website under their category."
        actions={<Button onClick={() => setEditing("new")} className="bg-gold text-brown hover:bg-gold-deep hover:text-cream"><Plus /> Add category</Button>} />
      {editing && <CategoryForm key={editing === "new" ? "new" : editing.id} category={editing === "new" ? null : editing} mutate={mutate} onDone={() => setEditing(null)} />}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-warm">
        {categories.map((category, index) => {
          const count = products.filter((p) => p.category_id === category.id).length;
          return (
            <div key={category.id} className="flex flex-wrap items-center gap-4 border-b border-border p-4 last:border-0">
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Move down" disabled={index === categories.length - 1} onClick={() => move(index, index + 1)}><ArrowDown /></Button>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-beige">
                {category.image_url ? <img src={category.image_url} alt={category.name} className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brown">{category.name}</p>
                <p className="truncate text-xs text-muted-foreground">/{category.slug} · {count} {count === 1 ? "product" : "products"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill value={category.is_published ? "Published" : "Hidden"} tone={category.is_published ? "good" : "muted"} />
                <Switch checked={category.is_published} aria-label="Published" onCheckedChange={(value) => void mutate({ action: "toggleCategory", id: category.id, value })} />
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(category)}><Pencil /> Edit</Button>
              <Confirm title={`Delete ${category.name}?`} description={count ? `${count} products will stay but lose this category.` : "This category will be removed."}
                onConfirm={() => void mutate({ action: "deleteCategory", id: category.id })}>
                <Button size="icon" variant="ghost" className="text-destructive" aria-label="Delete category"><Trash2 /></Button>
              </Confirm>
            </div>
          );
        })}
        {!categories.length && <p className="py-14 text-center text-sm text-muted-foreground">No categories yet</p>}
      </div>
    </div>
  );
}

function CategoryForm({ category, mutate, onDone }: { category: AdminCategory | null; mutate: Mutate; onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [published, setPublished] = useState(category?.is_published ?? true);
  const [seoTitle, setSeoTitle] = useState(category?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(category?.seo_description ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fields = { name: name.trim(), slug: slugify(slug || name), description: description.trim(), imageUrl, published, seoTitle: seoTitle.trim(), seoDescription: seoDescription.trim() };
    const res = await mutate(category ? { action: "editCategory", id: category.id, ...fields } : { action: "addCategory", ...fields });
    setSaving(false);
    if (res?.ok) onDone();
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-gold/35 bg-card p-5 shadow-warm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-brown">{category ? "Edit category" : "New category"}</h3>
        <Button type="button" size="icon" variant="ghost" onClick={onDone} aria-label="Close"><X /></Button>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div><Label htmlFor="c-name">Name</Label><Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></div>
        <div><Label htmlFor="c-slug">Web address name</Label><Input id="c-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(name) || "organic-honey"} /></div>
        <div className="lg:col-span-2"><Label htmlFor="c-desc">Description</Label><Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
        <div>
          <Label>Category photo</Label>
          <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gold-deep/40 bg-beige/50 p-3">
            {imageUrl ? <img src={imageUrl} alt="" className="h-14 w-14 rounded object-cover" /> : <ImagePlus className="h-6 w-6 text-gold-deep" />}
            <span className="text-sm font-medium text-brown">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : imageUrl ? "Replace photo" : "Upload photo"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); const url = await uploadProductImage(f); setUploading(false); if (url) setImageUrl(url); }} />
          </label>
          {imageUrl && <Button type="button" variant="link" className="px-0 text-destructive" onClick={() => setImageUrl("")}>Remove photo</Button>}
        </div>
        <label className="flex items-center gap-3 self-center text-sm"><Switch checked={published} onCheckedChange={setPublished} /> Show on website</label>
        <div><Label htmlFor="c-seo-t">Search engine title</Label><Input id="c-seo-t" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={120} /></div>
        <div><Label htmlFor="c-seo-d">Search engine description</Label><Input id="c-seo-d" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={300} /></div>
      </div>
      <div className="mt-5 flex gap-2">
        <Button type="submit" disabled={saving || uploading} className="bg-leaf text-accent-foreground hover:bg-leaf/90">{saving && <Loader2 className="animate-spin" />}Save category</Button>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
