import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().min(1), name: z.string().min(1), sizeId: z.string().min(1),
  sizeLabel: z.string().min(1), price: z.number().int().min(0), quantity: z.number().int().min(1).max(20),
});

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2).max(100), email: z.string().trim().email().max(255), mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().min(5).max(300), city: z.string().min(2).max(80), state: z.string().min(2).max(80),
  pin: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"), items: z.array(itemSchema).min(1).max(20),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Link the order to the signed-in customer, verified from their session token.
    let userId: string | null = null;
    const { getRequest } = await import("@tanstack/react-start/server");
    const auth = getRequest().headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
      userId = u.user?.id ?? null;
    }
    // Never trust prices from the browser: load real prices and stock.
    const ids = [...new Set(data.items.map((i) => i.sizeId))];
    const { data: variants, error: vErr } = await supabaseAdmin.from("product_variants")
      .select("id,product_id,label,price,stock,is_active,cost_price").in("id", ids);
    if (vErr) throw new Error("Could not verify products");
    const items = data.items.map((item) => {
      const v = variants?.find((x) => x.id === item.sizeId && x.product_id === item.productId);
      if (!v || !v.is_active) throw new Error(`${item.name} is no longer available`);
      if (v.stock < item.quantity) throw new Error(`Only ${v.stock} left of ${item.name} (${v.label})`);
      return { ...item, price: v.price, sizeLabel: v.label, unitCost: v.cost_price };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = `VE${Date.now().toString().slice(-8)}`;
    const { data: customer, error: customerError } = await supabaseAdmin.from("customers").insert({
      full_name: data.fullName, email: data.email, mobile: data.mobile, address: data.address,
      city: data.city, state: data.state, pin: data.pin,
    }).select("id").single();
    if (customerError || !customer) throw customerError ?? new Error("Could not create customer");
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").insert({
      order_number: orderNumber, customer_id: customer.id, subtotal, delivery: 0, total: subtotal, user_id: userId,
    }).select("id").single();
    if (orderError || !order) throw orderError ?? new Error("Could not create order");
    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(items.map((item) => ({
      order_id: order.id, product_id: item.productId, product_name: item.name, size_id: item.sizeId,
      size_label: item.sizeLabel, price: item.price, quantity: item.quantity, unit_cost: item.unitCost,
    })));
    if (itemsError) throw itemsError;
    return { orderNumber };
  });