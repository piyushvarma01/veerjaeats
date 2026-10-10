import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart-context";
import { createOrder } from "@/lib/orders.functions";
import { inr } from "@/lib/shop-data";

const FIELDS = [
  { id: "fullName", label: "Full Name", type: "text", placeholder: "Your name", required: true, maxLength: 100 },
  {
    id: "mobile",
    label: "Mobile Number",
    type: "tel",
    placeholder: "10-digit mobile number",
    required: true,
    pattern: "[6-9][0-9]{9}",
    maxLength: 10,
  },
  { id: "email", label: "Email", type: "email", placeholder: "you@email.com", required: true },
  { id: "city", label: "City", type: "text", placeholder: "City", required: true },
  { id: "state", label: "State", type: "text", placeholder: "State", required: true },
  { id: "pin", label: "PIN Code", type: "text", placeholder: "6-digit PIN", required: true, pattern: "[0-9]{6}", maxLength: 6 },
] as const;

export function Checkout() {
  const { isCheckoutOpen, closeCheckout, items, subtotal, delivery, total, placeOrder } = useCart();
  const createOrderFn = useServerFn(createOrder);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("fullName") ?? "Customer");
    setSubmitting(true);
    try {
      const result = await createOrderFn({ data: {
        fullName: name,
        email: String(data.get("email") ?? ""),
        mobile: String(data.get("mobile") ?? ""),
        address: String(data.get("address") ?? ""),
        city: String(data.get("city") ?? ""),
        state: String(data.get("state") ?? ""),
        pin: String(data.get("pin") ?? ""),
        items: items.map((item) => ({
          productId: item.productId, name: item.name, sizeId: item.sizeId,
          sizeLabel: item.sizeLabel, price: item.price, quantity: item.quantity,
        })),
      } });
      placeOrder(name, result.orderNumber);
    } catch (error) {
      toast.error("We couldn't place your order", { description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Checkout"
          onKeyDown={(e) => e.key === "Escape" && closeCheckout()}
          className="fixed inset-0 z-80 flex items-start justify-center overflow-y-auto bg-brown/50 p-3 backdrop-blur-sm sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="my-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-background shadow-warm-lg"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4 sm:px-7">
              <h2 className="min-w-0 truncate font-display text-xl font-semibold text-brown sm:text-2xl">
                Checkout
              </h2>
              <button
                type="button"
                onClick={closeCheckout}
                aria-label="Close checkout"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-brown hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.2fr_1fr]">
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold text-brown">
                  Customer Information
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {FIELDS.map((f) => (
                    <div key={f.id} className="min-w-0">
                      <Label htmlFor={f.id} className="text-xs text-muted-foreground">
                        {f.label}
                      </Label>
                      <Input
                        id={f.id}
                        name={f.id}
                        type={f.type}
                        required={f.required}
                        placeholder={f.placeholder}
                        pattern={"pattern" in f ? f.pattern : undefined}
                        maxLength={"maxLength" in f ? f.maxLength : 120}
                        className="mt-1.5 bg-card"
                      />
                    </div>
                  ))}
                  <div className="min-w-0 sm:col-span-2">
                    <Label htmlFor="address" className="text-xs text-muted-foreground">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      required
                      rows={3}
                      maxLength={300}
                      placeholder="House / street / landmark"
                      className="mt-1.5 bg-card"
                    />
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-border bg-beige/60 p-5">
                <h3 className="font-display text-lg font-semibold text-brown">Order Summary</h3>
                <ul className="mt-4 space-y-3">
                  {items.map((i) => (
                    <li key={i.key} className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-brown">{i.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {i.sizeLabel} × {i.quantity}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-brown">
                        {inr(i.price * i.quantity)}
                      </span>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="text-sm text-muted-foreground">Your cart is empty.</li>
                  )}
                </ul>
                <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Subtotal</dt>
                    <dd>{inr(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Delivery</dt>
                    <dd className="text-leaf">{delivery === 0 ? "Free" : inr(delivery)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold text-brown">
                    <dt>Total Amount</dt>
                    <dd>{inr(total)}</dd>
                  </div>
                </dl>
                <Button
                  type="submit"
                  size="lg"
                  disabled={items.length === 0 || submitting}
                  className="mt-5 w-full bg-gradient-to-r from-gold to-gold-deep text-primary-foreground shadow-warm hover:opacity-95"
                >
                  {submitting ? <><Loader2 className="animate-spin" /> Placing Order…</> : "Place Order"}
                </Button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Cash on delivery & online payment options coming soon.
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
