import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toWebP } from "@/lib/image-webp";
import { SITE_IMAGE_SLOTS } from "@/lib/site-images";

type Row = { slot: string; image_url: string; storage_path: string };
const BUCKET = "site-assets";

export function WebsiteImagesPanel() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-site-images"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_images").select("slot,image_url,storage_path");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.slot, r])) as Record<string, Row>;
    },
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-site-images"] }); void qc.invalidateQueries({ queryKey: ["storefront-site-images"] }); };
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Something went wrong");

  const upload = useMutation({
    mutationFn: async ({ slot, file: original }: { slot: string; file: File }) => {
      if (!original.type.startsWith("image/")) throw new Error("Choose a JPG, PNG or WebP image");
      if (original.size > 15 * 1024 * 1024) throw new Error("Photo must be smaller than 15 MB");
      const file = await toWebP(original, 0.9, 2400);
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
      const path = `site/${slot}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      const old = q.data?.[slot];
      const { error: dbErr } = await supabase.from("site_images").upsert({ slot, storage_path: path, image_url: `/api/public/site-image?path=${encodeURIComponent(path)}` });
      if (dbErr) throw dbErr;
      if (old) await supabase.storage.from(BUCKET).remove([old.storage_path]);
    },
    onSuccess: () => { toast.success("Photo updated on the website"); refresh(); }, onError: fail,
  });
  const reset = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase.from("site_images").delete().eq("slot", row.slot);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    },
    onSuccess: () => { toast.success("Back to the original photo"); refresh(); }, onError: fail,
  });
  const busySlot = upload.isPending ? upload.variables?.slot : null;

  return (
    <section className="bg-card p-5 shadow-warm">
      <h2 className="font-display text-2xl font-semibold text-brown">Website images</h2>
      <p className="mt-1 text-sm text-muted-foreground">Every photo on your homepage. Upload a new one to replace it, or remove yours to go back to the original.</p>
      {q.isLoading ? <div className="grid place-items-center py-16"><Loader2 className="h-7 w-7 animate-spin text-gold-deep" /></div> : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SITE_IMAGE_SLOTS.map((s) => {
            const row = q.data?.[s.slot];
            return (
              <article key={s.slot} className="overflow-hidden rounded-xl border border-border bg-background">
                <div className="relative bg-beige">
                  <img src={row?.image_url ?? s.fallback} alt={s.label} className="h-48 w-full object-cover" />
                  <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">{row ? "Your photo" : "Original"}</span>
                  {busySlot === s.slot && <div className="absolute inset-0 grid place-items-center bg-background/60"><Loader2 className="h-7 w-7 animate-spin text-gold-deep" /></div>}
                </div>
                <div className="p-3">
                  <p className="font-medium text-brown">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.section}</p>
                  <div className="mt-3 flex gap-2">
                    <label className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      <Upload className="h-4 w-4" /> {row ? "Replace" : "Upload"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={upload.isPending} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload.mutate({ slot: s.slot, file: f }); }} />
                    </label>
                    {row && <Button variant="outline" size="sm" className="h-9" disabled={reset.isPending} onClick={() => { if (confirm("Remove your photo and use the original?")) reset.mutate(row); }}><RotateCcw /> Remove</Button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="mt-5 text-xs text-muted-foreground">Product photos are managed in Products, and gallery photos in Gallery.</p>
    </section>
  );
}
