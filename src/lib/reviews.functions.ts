import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const mediaUrl = (path: string) => `/api/public/review-media?path=${encodeURIComponent(path)}`;

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const [orders, reviews] = await Promise.all([
      db.from("orders").select("id,order_number,status,total,created_at,order_items(id,product_id,product_name,size_label,quantity,price)")
        .eq("user_id", context.userId).order("created_at", { ascending: false }),
      db.from("reviews").select("id,order_id,product_id,status,rating").eq("user_id", context.userId),
    ]);
    if (orders.error) throw new Error("Could not load your orders");
    return { orders: orders.data ?? [], reviews: reviews.data ?? [], email: (context.claims as { email?: string }).email ?? "" };
  });

const submitSchema = z.object({
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().max(100),
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(5).max(2000),
  media: z.array(z.object({ path: z.string().min(5).max(300), kind: z.enum(["photo", "video"]) })).max(7),
});

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const photos = data.media.filter((m) => m.kind === "photo").length;
    const videos = data.media.filter((m) => m.kind === "video").length;
    if (photos > 5 || videos > 2) throw new Error("Up to 5 photos and 2 videos per review");
    if (data.media.some((m) => !m.path.startsWith(`${context.userId}/`) || m.path.includes(".."))) throw new Error("Invalid upload");

    // Verify ownership + delivery through the customer's own RLS-scoped access.
    const { data: order } = await context.supabase.from("orders")
      .select("id,status,order_items(product_id)").eq("id", data.orderId).eq("user_id", context.userId).maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.status !== "delivered") throw new Error("You can review once your order is delivered");
    if (!order.order_items.some((i) => i.product_id === data.productId)) throw new Error("This product isn't in that order");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: review, error } = await supabaseAdmin.from("reviews").insert({
      customer_name: data.name, city: data.city, rating: data.rating, review: data.review,
      status: "pending", order_id: data.orderId, product_id: data.productId, user_id: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.code === "23505" ? "You already reviewed this product for this order" : "Could not save your review");
    if (data.media.length) {
      const { error: mErr } = await supabaseAdmin.from("review_media").insert(
        data.media.map((m, i) => ({ review_id: review.id, kind: m.kind, storage_path: m.path, sort_order: i })),
      );
      if (mErr) throw new Error("Review saved, but some photos could not be attached");
    }
    return { ok: true };
  });

export const getProductReviews = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ productId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const url = process.env["SUPABASE_URL"];
    if (!key || !url) return [];
    const db = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
    });
    const { data: rows, error } = await db.from("reviews")
      .select("id,customer_name,city,rating,review,created_at,order_id,review_media(id,kind,storage_path,sort_order)")
      .eq("status", "approved").eq("product_id", data.productId).order("created_at", { ascending: false }).limit(50);
    if (error) { console.error("Product reviews failed", error); return []; }
    return (rows ?? []).map((r) => ({
      id: r.id, name: r.customer_name, city: r.city, rating: r.rating, review: r.review, verified: Boolean(r.order_id),
      media: [...r.review_media].sort((a, b) => a.sort_order - b.sort_order).map((m) => ({ id: m.id, kind: m.kind as "photo" | "video", url: mediaUrl(m.storage_path) })),
    }));
  });
