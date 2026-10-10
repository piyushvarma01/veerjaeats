import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toWebP } from "@/lib/image-webp";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; image_url: string; storage_path: string; caption: string; is_published: boolean; sort_order: number };

const BUCKET = "site-assets";
const urlFor = (path: string) => `/api/public/site-image?path=${encodeURIComponent(path)}`;

async function uploadFile(original: File) {
  if (!original.type.startsWith("image/")) throw new Error("Choose a JPG, PNG or WebP image");
  if (original.size > 15 * 1024 * 1024) throw new Error("Each photo must be smaller than 15 MB");
  const file = await toWebP(original, 0.9, 2000);
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  const path = `gallery/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export function GalleryPanel() {
  const qc = useQueryClient();
  const [over, setOver] = useState(false);
  const list = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_images").select("*").order("sort_order").order("created_at", { ascending: false });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-gallery"] }); void qc.invalidateQueries({ queryKey: ["storefront-gallery"] }); };
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Something went wrong");

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const f of files) {
        const path = await uploadFile(f);
        const { error } = await supabase.from("gallery_images").insert({ image_url: urlFor(path), storage_path: path });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Photos added to gallery"); refresh(); }, onError: fail,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<GalleryImage> & { id: string }) => {
      const { error } = await supabase.from("gallery_images").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); refresh(); }, onError: fail,
  });
  const replace = useMutation({
    mutationFn: async ({ img, file }: { img: GalleryImage; file: File }) => {
      const path = await uploadFile(file);
      const { error } = await supabase.from("gallery_images").update({ image_url: urlFor(path), storage_path: path }).eq("id", img.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([img.storage_path]);
    },
    onSuccess: () => { toast.success("Photo replaced"); refresh(); }, onError: fail,
  });
  const remove = useMutation({
    mutationFn: async (img: GalleryImage) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", img.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([img.storage_path]);
    },
    onSuccess: () => { toast.success("Photo removed"); refresh(); }, onError: fail,
  });

  const pick = (files: FileList | null) => { if (files?.length) upload.mutate(Array.from(files)); };
  const images = list.data ?? [];

  return (
    <section className="bg-card p-5 shadow-warm">
      <h2 className="font-display text-2xl font-semibold text-brown">Gallery</h2>
      <p className="mt-1 text-sm text-muted-foreground">These photos appear in the gallery section of your website. Hidden photos stay here but customers don't see them.</p>

      <label
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
        className={cn("mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors", over ? "border-gold bg-gold/10" : "border-gold-deep/35 bg-beige/50 hover:bg-gold/5")}>
        {upload.isPending ? <Loader2 className="h-8 w-8 animate-spin text-gold-deep" /> : <ImagePlus className="h-8 w-8 text-gold-deep" />}
        <span className="font-medium text-brown">{upload.isPending ? "Uploading photos…" : "Drag photos here or click to add"}</span>
        <span className="text-xs text-muted-foreground">Pick several at once · up to 15 MB each</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={upload.isPending} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      </label>

      {list.isLoading && <div className="grid place-items-center py-14"><Loader2 className="h-7 w-7 animate-spin text-gold-deep" /></div>}
      {!list.isLoading && images.length === 0 && <p className="py-14 text-center text-sm text-muted-foreground">No gallery photos yet. Your website shows the default photos until you add some.</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {images.map((img, index) => (
          <article key={img.id} className={cn("overflow-hidden rounded-xl border bg-background shadow-sm", img.is_published ? "border-border" : "border-dashed border-muted-foreground/40 opacity-70")}>
            <div className="relative bg-beige">
              <img src={img.image_url} alt={img.caption || "Gallery photo"} className="h-48 w-full object-cover" />
              {!img.is_published && <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">Hidden</span>}
            </div>
            <div className="space-y-2 p-3">
              <Input defaultValue={img.caption} placeholder="Caption (optional)" maxLength={120} onBlur={(e) => { if (e.target.value !== img.caption) update.mutate({ id: img.id, caption: e.target.value }); }} />
              <div className="flex flex-wrap items-center gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => update.mutate({ id: img.id, is_published: !img.is_published })}>
                  {img.is_published ? <><EyeOff /> Hide</> : <><Eye /> Show</>}
                </Button>
                <Input type="number" aria-label="Position" className="h-8 w-16" defaultValue={img.sort_order || index + 1} onBlur={(e) => { const v = Number(e.target.value); if (v !== img.sort_order) update.mutate({ id: img.id, sort_order: v }); }} />
                <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-input px-2 text-xs font-medium hover:bg-accent">
                  <RefreshCw className="h-3.5 w-3.5" /> Replace
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) replace.mutate({ img, file: f }); }} />
                </label>
                <Button type="button" size="icon" variant="ghost" className="ml-auto text-destructive" aria-label="Delete photo" onClick={() => { if (confirm("Delete this photo from the gallery?")) remove.mutate(img); }}><Trash2 /></Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
