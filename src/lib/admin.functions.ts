import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getAdminClientFor(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden: administrator access required");
  return supabaseAdmin;
}

export const getAdminState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: role }, { count }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle(),
      supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    ]);
    return { isAdmin: Boolean(role), canClaim: (count ?? 0) === 0 };
  });

export const claimInitialAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("An administrator already exists");
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) throw error;
    return { ok: true, id: createdId };
  });

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdminClientFor(context.userId);
    const [orders, products, customers, reviews, reels, messages, categories, settings] = await Promise.all([
      db.from("orders").select("*, customers(*), order_items(*)").order("created_at", { ascending: false }),
      db
        .from("products")
        .select("*, product_variants(*), product_images(*)")
        .order("sort_order")
        .order("created_at"),
      db.from("customers").select("*, orders(id,total,status,created_at)").order("created_at", { ascending: false }),
      db.from("reviews").select("*").order("created_at", { ascending: false }),
      db.from("reels").select("*").order("sort_order"),
      db.from("customer_messages").select("*").order("created_at", { ascending: false }),
      db.from("categories").select("*").order("sort_order").order("name"),
      db.from("site_settings").select("id,logo_url").order("created_at").limit(1).maybeSingle(),
    ]);
    const failed = [orders, products, customers, reviews, reels, messages, categories].find((result) => result.error);
    if (failed?.error) throw failed.error;
    const productRows = (products.data ?? []).map((product) => ({
      ...product,
      product_variants: [...product.product_variants].sort(
        (a, b) => a.sort_order - b.sort_order || a.price - b.price,
      ),
      product_images: [...product.product_images].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      ),
    }));
    return {
      orders: orders.data ?? [],
      products: productRows,
      customers: customers.data ?? [],
      reviews: reviews.data ?? [],
      reels: reels.data ?? [],
      messages: messages.data ?? [],
      categories: categories.data ?? [],
      settings: settings.data ?? null,
    };
  });

const variantInput = z.object({
  label: z.string().trim().min(1).max(60),
  sku: z.string().trim().min(2).max(40),
  mrp: z.number().int().min(1),
  discount: z.number().min(0).max(90),
  stock: z.number().int().min(0),
});

const productImageUrl = z
  .string()
  .max(500)
  .refine(
    (value) => value === "" || value.startsWith("/api/public/product-image?path="),
    "Upload the image through the admin panel",
  );

const slugField = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes")
  .min(2)
  .max(80);

const productFields = {
  name: z.string().trim().min(2).max(120),
  shortName: z.string().trim().min(1).max(60),
  slug: slugField,
  sku: z.string().trim().max(60),
  categoryId: z.string().uuid().nullable(),
  shortDescription: z.string().trim().max(300),
  description: z.string().trim().max(4000),
  weight: z.string().trim().max(60),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  imageUrl: productImageUrl,
  active: z.boolean(),
  featured: z.boolean(),
  bestseller: z.boolean(),
  newArrival: z.boolean(),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
  seoKeywords: z.string().trim().max(300),
};

const categoryFields = {
  name: z.string().trim().min(2).max(80),
  slug: slugField,
  description: z.string().trim().max(1000),
  imageUrl: productImageUrl,
  published: z.boolean(),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
};

export const mutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("orderStatus"), id: z.string().uuid(), value: z.enum(["new", "confirmed", "packed", "shipped", "delivered", "cancelled"]) }),
  z.object({ action: z.literal("reviewStatus"), id: z.string().uuid(), value: z.enum(["pending", "approved", "rejected"]) }),
  z.object({ action: z.literal("updateReview"), id: z.string().uuid(), customerName: z.string().trim().min(2).max(100), city: z.string().trim().max(100), rating: z.number().int().min(1).max(5), review: z.string().trim().min(2).max(2000), status: z.enum(["pending", "approved", "rejected"]) }),
  z.object({ action: z.literal("deleteReview"), id: z.string().uuid() }),
  z.object({ action: z.literal("messageStatus"), id: z.string().uuid(), value: z.enum(["unread", "read", "resolved"]) }),
  z.object({ action: z.literal("toggleProduct"), id: z.string().uuid(), value: z.boolean() }),
  z.object({ action: z.literal("productFlags"), id: z.string().uuid(), featured: z.boolean(), bestseller: z.boolean(), newArrival: z.boolean() }),
  z.object({ action: z.literal("duplicateProduct"), id: z.string().uuid() }),
  z.object({ action: z.literal("reorderProducts"), ids: z.array(z.string().uuid()).max(200) }),
  z.object({ action: z.literal("updateVariant"), id: z.string().uuid(), price: z.number().int().min(0), mrp: z.number().int().min(0), stock: z.number().int().min(0), active: z.boolean() }),
  z.object({ action: z.literal("addReel"), title: z.string().min(2).max(120), mediaUrl: z.string().url(), caption: z.string().max(500), published: z.boolean() }),
  z.object({ action: z.literal("toggleReel"), id: z.string().uuid(), value: z.boolean() }),
  z.object({ action: z.literal("deleteReel"), id: z.string().uuid() }),
  z.object({ action: z.literal("addProduct"), ...productFields, variants: z.array(variantInput).min(1).max(12), images: z.array(z.object({ imageUrl: productImageUrl, altText: z.string().trim().max(160) })).max(12).default([]) }),
  z.object({ action: z.literal("editProduct"), id: z.string().uuid(), ...productFields }),
  variantInput.extend({ action: z.literal("addVariant"), productId: z.string().uuid() }),
  z.object({ action: z.literal("deleteVariant"), id: z.string().uuid() }),
  z.object({ action: z.literal("deleteProduct"), id: z.string().uuid() }),
  z.object({
    action: z.literal("addProductImages"),
    productId: z.string().uuid(),
    images: z.array(z.object({ imageUrl: productImageUrl, altText: z.string().trim().max(160) })).min(1).max(12),
  }),
  z.object({ action: z.literal("updateProductImage"), id: z.string().uuid(), altText: z.string().trim().max(160), imageUrl: productImageUrl.optional() }),
  z.object({ action: z.literal("deleteProductImage"), id: z.string().uuid() }),
  z.object({ action: z.literal("setPrimaryImage"), productId: z.string().uuid(), id: z.string().uuid() }),
  z.object({ action: z.literal("reorderProductImages"), productId: z.string().uuid(), ids: z.array(z.string().uuid()).max(24) }),
  z.object({ action: z.literal("addCategory"), ...categoryFields }),
  z.object({ action: z.literal("editCategory"), id: z.string().uuid(), ...categoryFields }),
  z.object({ action: z.literal("toggleCategory"), id: z.string().uuid(), value: z.boolean() }),
  z.object({ action: z.literal("deleteCategory"), id: z.string().uuid() }),
  z.object({ action: z.literal("reorderCategories"), ids: z.array(z.string().uuid()).max(100) }),
  z.object({
    action: z.literal("updateLogo"),
    logoUrl: z.string().max(500).refine((value) => value === "" || value.startsWith("/api/public/site-image?path="), "Upload a logo image"),
  }),
]);

function sellingPrice(mrp: number, discount: number) {
  return Math.max(1, Math.round(mrp * (1 - discount / 100)));
}

type ProductFieldValues = {
  name: string; shortName: string; slug: string; sku: string; categoryId: string | null;
  shortDescription: string; description: string; weight: string; tags: string[]; imageUrl: string;
  active: boolean; featured: boolean; bestseller: boolean; newArrival: boolean;
  seoTitle: string; seoDescription: string; seoKeywords: string;
};

function productRow(data: ProductFieldValues) {
  return {
    name: data.name, short_name: data.shortName, slug: data.slug, sku: data.sku,
    category_id: data.categoryId, short_description: data.shortDescription, description: data.description,
    weight: data.weight, tags: data.tags, image_url: data.imageUrl || null, is_active: data.active,
    is_featured: data.featured, is_bestseller: data.bestseller, is_new_arrival: data.newArrival,
    seo_title: data.seoTitle, seo_description: data.seoDescription, seo_keywords: data.seoKeywords,
  };
}

type CategoryFieldValues = {
  name: string; slug: string; description: string; imageUrl: string;
  published: boolean; seoTitle: string; seoDescription: string;
};

function categoryRow(data: CategoryFieldValues) {
  return {
    name: data.name, slug: data.slug, description: data.description,
    image_url: data.imageUrl || null, is_published: data.published,
    seo_title: data.seoTitle, seo_description: data.seoDescription,
  };
}

export type AdminMutation = z.infer<typeof mutationSchema>;

export const mutateAdminData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => mutationSchema.parse(input))
  .handler(async ({ context, data }) => {
    const db = await getAdminClientFor(context.userId);
    let result;
    let createdId: string | null = null;
    if (data.action === "orderStatus") result = await db.from("orders").update({ status: data.value }).eq("id", data.id);
    else if (data.action === "reviewStatus") result = await db.from("reviews").update({ status: data.value }).eq("id", data.id);
    else if (data.action === "updateReview") result = await db.from("reviews").update({ customer_name: data.customerName, city: data.city, rating: data.rating, review: data.review, status: data.status }).eq("id", data.id);
    else if (data.action === "deleteReview") result = await db.from("reviews").delete().eq("id", data.id);
    else if (data.action === "messageStatus") result = await db.from("customer_messages").update({ status: data.value }).eq("id", data.id);
    else if (data.action === "toggleProduct") result = await db.from("products").update({ is_active: data.value }).eq("id", data.id);
    else if (data.action === "productFlags") {
      result = await db.from("products").update({ is_featured: data.featured, is_bestseller: data.bestseller, is_new_arrival: data.newArrival }).eq("id", data.id);
    } else if (data.action === "duplicateProduct") {
      const { data: source, error } = await db
        .from("products")
        .select("*, product_variants(*), product_images(*)")
        .eq("id", data.id)
        .single();
      if (error) throw error;
      const suffix = Date.now().toString().slice(-5);
      const { data: copy, error: copyError } = await db
        .from("products")
        .insert({
          name: `${source.name} (copy)`, short_name: source.short_name, slug: `${source.slug}-copy-${suffix}`,
          sku: source.sku ? `${source.sku}-C${suffix}` : "", category_id: source.category_id,
          short_description: source.short_description, description: source.description, weight: source.weight,
          tags: source.tags, image_url: source.image_url, is_active: false, is_featured: source.is_featured,
          is_bestseller: source.is_bestseller, is_new_arrival: source.is_new_arrival,
          seo_title: source.seo_title, seo_description: source.seo_description, seo_keywords: source.seo_keywords,
        })
        .select("id")
        .single();
      if (copyError) throw copyError;
      if (source.product_variants.length) {
        const { error: variantError } = await db.from("product_variants").insert(
          source.product_variants.map((variant) => ({
            product_id: copy.id, sku: `${variant.sku}-C${suffix}`, label: variant.label, mrp: variant.mrp,
            price: variant.price, stock: variant.stock, is_active: variant.is_active, sort_order: variant.sort_order,
          })),
        );
        if (variantError) throw variantError;
      }
      if (source.product_images.length) {
        const { error: imageError } = await db.from("product_images").insert(
          source.product_images.map((image) => ({
            product_id: copy.id, image_url: image.image_url, alt_text: image.alt_text,
            sort_order: image.sort_order, is_primary: image.is_primary,
          })),
        );
        if (imageError) throw imageError;
      }
      result = { error: null };
    } else if (data.action === "reorderProducts") {
      for (const [index, id] of data.ids.entries()) {
        const { error } = await db.from("products").update({ sort_order: index }).eq("id", id);
        if (error) throw error;
      }
      result = { error: null };
    } else if (data.action === "updateVariant") {
      if (data.mrp < data.price) throw new Error("List price must be at least the selling price");
      result = await db.from("product_variants").update({ price: data.price, mrp: data.mrp, stock: data.stock, is_active: data.active }).eq("id", data.id);
    } else if (data.action === "addReel") result = await db.from("reels").insert({ title: data.title, media_url: data.mediaUrl, caption: data.caption, is_published: data.published });
    else if (data.action === "toggleReel") result = await db.from("reels").update({ is_published: data.value }).eq("id", data.id);
    else if (data.action === "deleteReel") result = await db.from("reels").delete().eq("id", data.id);
    else if (data.action === "addProduct") {
      const { data: created, error } = await db.from("products").insert(productRow(data)).select("id").single();
      if (error) throw error;
      result = await db.from("product_variants").insert(data.variants.map((variant, index) => ({
        product_id: created.id, sku: variant.sku, label: variant.label, mrp: variant.mrp,
        price: sellingPrice(variant.mrp, variant.discount), stock: variant.stock, sort_order: index,
      })));
      if (result.error) {
        await db.from("products").delete().eq("id", created.id);
        throw result.error;
      }
      createdId = created.id;
      const images = data.images.length ? data.images.filter((i) => i.imageUrl) : data.imageUrl ? [{ imageUrl: data.imageUrl, altText: data.name }] : [];
      if (images.length) {
        await db.from("product_images").insert(images.map((image, index) => ({ product_id: created.id, image_url: image.imageUrl, alt_text: image.altText || data.name, sort_order: index, is_primary: index === 0 })));
        await db.from("products").update({ image_url: images[0]!.imageUrl }).eq("id", created.id);
      }
    } else if (data.action === "editProduct") {
      result = await db.from("products").update(productRow(data)).eq("id", data.id);
    } else if (data.action === "addVariant") {
      result = await db.from("product_variants").insert({
        product_id: data.productId, sku: data.sku, label: data.label, mrp: data.mrp,
        price: sellingPrice(data.mrp, data.discount), stock: data.stock,
      });
    } else if (data.action === "deleteVariant") result = await db.from("product_variants").delete().eq("id", data.id);
    else if (data.action === "addProductImages") {
      const { count } = await db.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", data.productId);
      const existing = count ?? 0;
      result = await db.from("product_images").insert(
        data.images.map((image, index) => ({
          product_id: data.productId, image_url: image.imageUrl, alt_text: image.altText,
          sort_order: existing + index, is_primary: existing === 0 && index === 0,
        })),
      );
      if (existing === 0 && data.images[0]) {
        await db.from("products").update({ image_url: data.images[0].imageUrl }).eq("id", data.productId);
      }
    } else if (data.action === "updateProductImage") {
      const patch: { alt_text: string; image_url?: string } = { alt_text: data.altText };
      if (data.imageUrl) patch.image_url = data.imageUrl;
      result = await db.from("product_images").update(patch).eq("id", data.id);
      if (data.imageUrl) {
        const { data: image } = await db.from("product_images").select("product_id,is_primary").eq("id", data.id).maybeSingle();
        if (image?.is_primary) await db.from("products").update({ image_url: data.imageUrl }).eq("id", image.product_id);
      }
    } else if (data.action === "deleteProductImage") {
      const { data: image } = await db.from("product_images").select("id,product_id,image_url,is_primary").eq("id", data.id).maybeSingle();
      result = await db.from("product_images").delete().eq("id", data.id);
      if (image?.is_primary) {
        const { data: next } = await db.from("product_images").select("id,image_url").eq("product_id", image.product_id).order("sort_order").limit(1).maybeSingle();
        if (next) {
          await db.from("product_images").update({ is_primary: true }).eq("id", next.id);
          await db.from("products").update({ image_url: next.image_url }).eq("id", image.product_id);
        } else {
          await db.from("products").update({ image_url: null }).eq("id", image.product_id);
        }
      }
    } else if (data.action === "setPrimaryImage") {
      const { data: image, error } = await db.from("product_images").select("image_url").eq("id", data.id).single();
      if (error) throw error;
      await db.from("product_images").update({ is_primary: false }).eq("product_id", data.productId);
      await db.from("product_images").update({ is_primary: true }).eq("id", data.id);
      result = await db.from("products").update({ image_url: image.image_url }).eq("id", data.productId);
    } else if (data.action === "reorderProductImages") {
      for (const [index, id] of data.ids.entries()) {
        const { error } = await db.from("product_images").update({ sort_order: index }).eq("id", id).eq("product_id", data.productId);
        if (error) throw error;
      }
      result = { error: null };
    } else if (data.action === "addCategory") {
      const { count } = await db.from("categories").select("id", { count: "exact", head: true });
      result = await db.from("categories").insert({ ...categoryRow(data), sort_order: count ?? 0 });
    } else if (data.action === "editCategory") {
      result = await db.from("categories").update(categoryRow(data)).eq("id", data.id);
    } else if (data.action === "toggleCategory") {
      result = await db.from("categories").update({ is_published: data.value }).eq("id", data.id);
    } else if (data.action === "deleteCategory") {
      result = await db.from("categories").delete().eq("id", data.id);
    } else if (data.action === "reorderCategories") {
      for (const [index, id] of data.ids.entries()) {
        const { error } = await db.from("categories").update({ sort_order: index }).eq("id", id);
        if (error) throw error;
      }
      result = { error: null };
    } else if (data.action === "updateLogo") {
      const { data: existing } = await db.from("site_settings").select("id").order("created_at").limit(1).maybeSingle();
      result = existing
        ? await db.from("site_settings").update({ logo_url: data.logoUrl || null }).eq("id", existing.id)
        : await db.from("site_settings").insert({ logo_url: data.logoUrl || null });
    } else {
      await db.from("product_variants").delete().eq("product_id", data.id);
      result = await db.from("products").delete().eq("id", data.id);
    }

    if (result.error) throw result.error;
    return { ok: true, id: createdId };
  });
