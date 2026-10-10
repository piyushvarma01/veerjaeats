import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Camera, Loader2, LogOut, Package, Star, Video, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { toWebP } from "@/lib/image-webp";
import { getMyOrders, submitReview } from "@/lib/reviews.functions";
import { inr } from "@/lib/shop-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [
    { title: "My Account & Orders — Veerja Eats" },
    { name: "description", content: "See your Veerja Eats orders and review the products you bought." },
    { property: "og:title", content: "My Account — Veerja Eats" },
    { property: "og:description", content: "Your Veerja Eats orders and reviews." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AccountPage,
});

type Target = { orderId: string; productId: string; productName: string };

function AccountPage() {
  const fetchOrders = useServerFn(getMyOrders);
  const q = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  const qc = useQueryClient(); const navigate = useNavigate();
  const [target, setTarget] = useState<Target | null>(null);
  const signOut = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await navigate({ to: "/", replace: true }); };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to shop</Link>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut /> Sign out</Button>
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold text-foreground">My orders</h1>
        {q.data?.email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {q.data.email}</p>}

        {q.isLoading && <div className="grid place-items-center py-20"><Loader2 className="h-7 w-7 animate-spin text-gold-deep" /></div>}
        {q.isError && <p className="mt-8 rounded-lg border border-destructive/30 p-6 text-destructive">We couldn't load your orders. Please refresh.</p>}
        {q.data && q.data.orders.length === 0 && (
          <div className="mt-10 rounded-xl border border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-gold-deep" />
            <p className="mt-3 font-medium text-foreground">No orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Orders you place while signed in will show up here.</p>
            <Button asChild className="mt-5"><Link to="/" hash="our-ghee">Shop now</Link></Button>
          </div>
        )}
        <div className="mt-8 space-y-4">
          {q.data?.orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-semibold text-foreground">Order #{order.order_number}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div>
                <div className="flex items-center gap-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", order.status === "delivered" ? "bg-leaf/12 text-leaf" : order.status === "cancelled" ? "bg-secondary text-muted-foreground" : "bg-gold/20 text-gold-deep")}>{order.status}</span><span className="font-semibold">{inr(order.total)}</span></div>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {order.order_items.map((item) => {
                  const done = q.data.reviews.find((r) => r.order_id === order.id && r.product_id === item.product_id);
                  return (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <p className="text-sm text-foreground">{item.product_name} <span className="text-muted-foreground">· {item.size_label} × {item.quantity}</span></p>
                      {order.status === "delivered" && (done
                        ? <span className="text-xs text-muted-foreground">{done.status === "approved" ? "Review published" : done.status === "pending" ? "Review waiting for approval" : "Review not published"}</span>
                        : <Button size="sm" variant="outline" onClick={() => setTarget({ orderId: order.id, productId: item.product_id, productName: item.product_name })}><Star /> Write a review</Button>)}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </div>
      <ReviewDialog target={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); void q.refetch(); }} />
      <Toaster position="bottom-right" />
    </main>
  );
}

type Picked = { file: File; kind: "photo" | "video"; preview: string };

function ReviewDialog({ target, onClose, onDone }: { target: Target | null; onClose: () => void; onDone: () => void }) {
  const submit = useServerFn(submitReview);
  const [rating, setRating] = useState(5);
  const [files, setFiles] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "photo" : null;
      if (!kind) { toast.error(`${file.name} isn't a photo or video`); continue; }
      if (kind === "photo" && file.size > 10 * 1024 * 1024) { toast.error("Photos must be under 10 MB"); continue; }
      if (kind === "video" && (file.size > 50 * 1024 * 1024 || !["video/mp4", "video/webm"].includes(file.type))) { toast.error("Videos must be MP4 or WebM, under 50 MB"); continue; }
      if (next.filter((f) => f.kind === kind).length >= (kind === "photo" ? 5 : 2)) { toast.error(kind === "photo" ? "Up to 5 photos" : "Up to 2 videos"); continue; }
      next.push({ file, kind, preview: URL.createObjectURL(file) });
    }
    setFiles(next);
  };

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!target) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again");
      const media: { path: string; kind: "photo" | "video" }[] = [];
      for (const f of files) {
        const file = f.kind === "photo" ? await toWebP(f.file, 0.85, 1600) : f.file;
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (f.kind === "photo" ? "webp" : "mp4");
        const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("review-media").upload(path, file, { contentType: file.type });
        if (error) throw new Error(`Upload failed: ${error.message}`);
        media.push({ path, kind: f.kind });
      }
      await submit({ data: {
        orderId: target.orderId, productId: target.productId, rating,
        name: String(form.get("name") ?? ""), city: String(form.get("city") ?? ""), review: String(form.get("review") ?? ""), media,
      } });
      toast.success("Thank you! Your review will appear once approved.");
      setFiles([]); setRating(5); onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your review");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogTitle className="font-display text-2xl">Review {target?.productName}</DialogTitle>
        <form onSubmit={send} className="space-y-4">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
                <Star className={cn("h-8 w-8 text-gold", n <= rating ? "fill-current" : "opacity-30")} />
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="rv-name">Your name</Label><Input id="rv-name" name="name" required minLength={2} maxLength={100} /></div>
            <div><Label htmlFor="rv-city">City</Label><Input id="rv-city" name="city" maxLength={100} /></div>
          </div>
          <div><Label htmlFor="rv-text">Your review</Label><Textarea id="rv-text" name="review" required minLength={5} maxLength={2000} rows={4} placeholder="How did you like it?" /></div>
          <div>
            <Label>Photos & videos (optional)</Label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gold-deep/35 bg-beige/50 p-4 text-sm text-brown hover:bg-gold/5">
              <Camera className="h-5 w-5" /><Video className="h-5 w-5" /> Add up to 5 photos and 2 videos
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="sr-only" disabled={busy} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
            </label>
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {files.map((f, i) => (
                  <div key={f.preview} className="relative aspect-square overflow-hidden rounded-md border border-border bg-secondary">
                    {f.kind === "photo" ? <img src={f.preview} alt="" className="h-full w-full object-cover" /> : <video src={f.preview} className="h-full w-full object-cover" muted />}
                    <button type="button" aria-label="Remove" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-background/90"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? <><Loader2 className="animate-spin" /> Sending…</> : "Submit review"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
