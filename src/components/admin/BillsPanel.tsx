import { useState } from "react";
import { Printer, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { inr } from "@/lib/shop-data";
import { cn } from "@/lib/utils";
import type { AdminData } from "./shared";

type Order = AdminData["orders"][number];

const SELLER = { name: "Veerja Eats", address: "India", gstin: "—" };

export function BillsPanel({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? "");
  const filtered = orders.filter((o) => `${o.order_number} ${o.customers?.full_name ?? ""} ${o.customers?.mobile ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const order = orders.find((o) => o.id === selectedId);

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-lg bg-card p-4 shadow-warm print:hidden">
        <div className="relative"><Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search orders" className="h-9 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm" /></div>
        <ul className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto">
          {filtered.map((o) => (
            <li key={o.id}><button type="button" onClick={() => setSelectedId(o.id)} className={cn("w-full rounded-md px-3 py-2 text-left text-sm", o.id === selectedId ? "bg-gold/20" : "hover:bg-secondary")}>
              <p className="font-semibold text-foreground">#{o.order_number}</p>
              <p className="text-xs text-muted-foreground">{o.customers?.full_name} · {inr(o.total)}</p>
            </button></li>
          ))}
          {!filtered.length && <li className="py-6 text-center text-sm text-muted-foreground">No orders yet</li>}
        </ul>
      </aside>

      {order ? (
        <div>
          <div className="mb-4 flex justify-end print:hidden"><Button onClick={() => window.print()}><Printer /> Print label & bill</Button></div>
          <div id="print-bill" className="space-y-6">
            <ShippingLabel order={order} />
            <Invoice order={order} />
          </div>
        </div>
      ) : <div className="grid place-items-center rounded-lg bg-card p-10 text-muted-foreground">Select an order to generate its bill</div>}
    </div>
  );
}

function Barcode({ value }: { value: string }) {
  const bars = Array.from(value).flatMap((ch) => { const c = ch.charCodeAt(0); return [c % 3 + 1, (c >> 2) % 2 + 1, c % 4 + 1, 1]; });
  return (
    <div className="flex h-14 items-stretch gap-px" aria-label={`Barcode ${value}`}>
      {bars.map((w, i) => <span key={i} style={{ width: w * 1.5 }} className={i % 2 === 0 ? "bg-foreground" : "bg-transparent"} />)}
    </div>
  );
}

function ShippingLabel({ order }: { order: Order }) {
  const c = order.customers;
  const cod = order.payment_method.toLowerCase().includes("cash");
  return (
    <section className="mx-auto max-w-[420px] break-inside-avoid border-2 border-foreground bg-background p-0 text-foreground">
      <div className="flex items-center justify-between border-b-2 border-foreground px-3 py-2">
        <span className="font-display text-lg font-bold">{SELLER.name}</span>
        <span className={cn("border-2 border-foreground px-2 py-0.5 text-sm font-bold")}>{cod ? `COD ${inr(order.total)}` : "PREPAID"}</span>
      </div>
      <div className="border-b-2 border-foreground px-3 py-2 text-sm">
        <p className="text-xs font-semibold uppercase">Deliver to</p>
        <p className="font-bold">{c?.full_name}</p>
        <p>{c?.address}</p>
        <p>{c?.city}, {c?.state}</p>
        <p className="font-bold">PIN {c?.pin}</p>
        <p>Mobile: {c?.mobile}</p>
      </div>
      <div className="flex flex-col items-center border-b-2 border-foreground px-3 py-3">
        <Barcode value={order.order_number} />
        <p className="mt-1 font-mono text-sm font-bold tracking-widest">{order.order_number}</p>
      </div>
      <div className="grid grid-cols-2 border-b-2 border-foreground text-xs">
        <div className="border-r-2 border-foreground px-3 py-2"><p className="font-semibold">Order date</p><p>{new Date(order.created_at).toLocaleDateString("en-IN")}</p></div>
        <div className="px-3 py-2"><p className="font-semibold">Items</p><p>{order.order_items.reduce((s, i) => s + i.quantity, 0)} pcs</p></div>
      </div>
      <div className="px-3 py-2 text-xs"><p className="font-semibold">Return address</p><p>{SELLER.name}, {SELLER.address}</p></div>
    </section>
  );
}

function Invoice({ order }: { order: Order }) {
  const c = order.customers;
  return (
    <section className="break-inside-avoid rounded-lg border border-border bg-background p-6 text-sm text-foreground">
      <div className="flex flex-wrap justify-between gap-4 border-b border-border pb-4">
        <div><h2 className="font-display text-2xl font-bold">Tax Invoice</h2><p className="text-muted-foreground">{SELLER.name} · {SELLER.address}</p><p className="text-muted-foreground">GSTIN: {SELLER.gstin}</p></div>
        <div className="text-right"><p><span className="text-muted-foreground">Invoice no:</span> INV-{order.order_number}</p><p><span className="text-muted-foreground">Order no:</span> {order.order_number}</p><p><span className="text-muted-foreground">Date:</span> {new Date(order.created_at).toLocaleDateString("en-IN")}</p><p><span className="text-muted-foreground">Payment:</span> {order.payment_method}</p></div>
      </div>
      <div className="grid gap-4 border-b border-border py-4 sm:grid-cols-2">
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">Bill to</p><p className="font-semibold">{c?.full_name}</p><p>{c?.email}</p><p>{c?.mobile}</p></div>
        <div><p className="text-xs font-semibold uppercase text-muted-foreground">Ship to</p><p>{c?.address}</p><p>{c?.city}, {c?.state} – {c?.pin}</p></div>
      </div>
      <table className="mt-4 w-full text-left">
        <thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="py-2">#</th><th>Item</th><th>Size</th><th className="text-right">Qty</th><th className="text-right">Rate</th><th className="text-right">Amount</th></tr></thead>
        <tbody>{order.order_items.map((i, n) => <tr key={i.id} className="border-b border-border/60"><td className="py-2">{n + 1}</td><td>{i.product_name}</td><td>{i.size_label}</td><td className="text-right">{i.quantity}</td><td className="text-right">{inr(i.price)}</td><td className="text-right">{inr(i.price * i.quantity)}</td></tr>)}</tbody>
      </table>
      <div className="mt-4 ml-auto max-w-xs space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
        <div className="flex justify-between"><span>Delivery</span><span>{order.delivery ? inr(order.delivery) : "Free"}</span></div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Grand total</span><span>{inr(order.total)}</span></div>
        <p className="text-xs text-muted-foreground">Prices are inclusive of all taxes.</p>
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">Thank you for shopping with {SELLER.name}! This is a computer-generated invoice.</p>
    </section>
  );
}
