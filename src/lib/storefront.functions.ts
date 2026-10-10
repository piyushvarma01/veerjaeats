import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";

import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("The storefront database is unavailable");

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getApprovedReviews = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await publicClient()
      .from("reviews")
      .select("id,customer_name,city,rating,review")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("[Storefront reviews]", error);
    return [];
  }
});
export const getStorefrontProducts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await publicClient()
      .from("products")
      .select("id,slug,name,short_name,description,short_description,image_url,sort_order,is_featured,is_bestseller,is_new_arrival,categories(name,slug,sort_order,is_published),product_images(image_url,alt_text,sort_order,is_primary,variant_id),product_variants(id,sku,label,price,mrp,stock,is_active,sort_order)")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(({ product_images, categories, ...product }) => ({
      ...product,
      category: categories && categories.is_published ? { name: categories.name, slug: categories.slug, sort_order: categories.sort_order } : null,
      images: [...product_images]
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
        .map((image) => ({ url: image.image_url, alt: image.alt_text, variantId: image.variant_id })),
      product_variants: product.product_variants
        .filter((variant) => variant.is_active)
        .sort((a, b) => a.sort_order - b.sort_order || a.price - b.price),
    })).filter((product) => product.product_variants.length > 0);
  } catch (error) {
    console.error("[Storefront products]", error);
    return [];
  }
});

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await publicClient()
      .from("site_settings")
      .select("logo_url")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { logoUrl: data?.logo_url ?? null };
  } catch (error) {
    console.error("[Site settings]", error);
    return { logoUrl: null };
  }
});
