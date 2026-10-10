import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { AlertTriangle, ArrowUpDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { inr } from "@/lib/shop-data";
import { cn } from "@/lib/utils";

type Item = { product_id: string; product_name: string; size_id: string; size_label: string; price: number; quantity: number; unit_cost: number };
type Order = { id: string; status: string; total: number; created_at: string; order_items: Item[] };
type Product = { id: string; name: string; product_variants: { id: string; label: string; cost_price: number }[] };

const RANGES = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
  { id: "365", label: "12 months", days: 365 },
  { id: "custom", label: "Custom", days: 0 },
] as const;

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);
const fmtKey = (k: string) => (k.length === 7
  ? new Date(`${k}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
  : new Date(k).toLocaleDateString("en-IN", { day: "numeric", month: "short" }));

function buckets(from: Date, to: Date, monthly: boolean) {
  const keys: string[] = [];
  const d = new Date(from);
  if (monthly) d.setDate(1);
  while (d <= to) {
    const k = monthly ? monthKey(d) : dayKey(d);
    if (!keys.includes(k)) keys.push(k);
    if (monthly) d.setMonth(d.getMonth() + 1); else d.setDate(d.getDate() + 1);
  }
  return keys;
}

const itemsCost = (o: Order) => o.order_items.reduce((s, i) => s + i.unit_cost * i.quantity, 0);

export function ReportsPanel({ orders, products }: { orders: Order[]; products: Product[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("30");
  const today = dayKey(new Date());
  const [from, setFrom] = useState(dayKey(new Date(Date.now() - 29 * 864e5)));
  const [to, setTo] = useState(today);
  const [sort, setSort] = useState<{ key: "units" | "sales" | "cost" | "profit" | "margin"; dir: 1 | -1 }>({ key: "sales", dir: -1 });

  const { start, end } = useMemo(() => {
    if (range === "custom") return { start: new Date(`${from}T00:00:00`), end: new Date(`${to}T23:59:59`) };
    const days = RANGES.find((r) => r.id === range)!.days;
    const s = new Date(); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - (days - 1));
    const e = new Date(); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }, [range, from, to]);

  const report = useMemo(() => {
    const inRange = orders.filter((o) => { const t = new Date(o.created_at); return t >= start && t <= end && o.status !== "cancelled"; });
    const sold = inRange.filter((o) => o.status !== "returned");
    const returned = inRange.filter((o) => o.status === "returned");
    const monthly = (end.getTime() - start.getTime()) / 864e5 > 92;
    const keys = buckets(start, end, monthly);
    const rows = new Map(keys.map((k) => [k, { key: k, label: fmtKey(k), sales: 0, returns: 0, cost: 0, profit: 0 }]));
    for (const o of inRange) {
      const k = monthly ? monthKey(new Date(o.created_at)) : dayKey(new Date(o.created_at));
      const r = rows.get(k); if (!r) continue;
      if (o.status === "returned") r.returns += o.total;
      else { r.sales += o.total; r.cost += itemsCost(o); }
    }
    const series = [...rows.values()].map((r) => ({ ...r, profit: r.sales - r.cost }));
    const sales = sold.reduce((s, o) => s + o.total, 0);
    const cost = sold.reduce((s, o) => s + itemsCost(o), 0);
    const returnsValue = returned.reduce((s, o) => s + o.total, 0);

    const byVariant = new Map<string, { name: string; units: number; sales: number; cost: number }>();
    for (const o of sold) for (const i of o.order_items) {
      const v = byVariant.get(i.size_id) ?? { name: `${i.product_name} · ${i.size_label}`, units: 0, sales: 0, cost: 0 };
      v.units += i.quantity; v.sales += i.price * i.quantity; v.cost += i.unit_cost * i.quantity;
      byVariant.set(i.size_id, v);
    }
    const table = [...byVariant.entries()].map(([id, v]) => ({ id, ...v, profit: v.sales - v.cost, margin: v.sales ? ((v.sales - v.cost) / v.sales) * 100 : 0 }));
    return { series, sales, cost, profit: sales - cost, orders: sold.length, returnsCount: returned.length, returnsValue, table };
  }, [orders, start, end]);

  const missingCost = products.flatMap((p) => p.product_variants.filter((v) => !v.cost_price).map((v) => `${p.name} · ${v.label}`));
  const table = [...report.table].sort((a, b) => (a[sort.key] - b[sort.key]) * sort.dir);
  const margin = report.sales ? (report.profit / report.sales) * 100 : 0;
  const head = (key: typeof sort.key, label: string) => (
    <th className="py-3 text-right"><button type="button" onClick={() => setSort({ key, dir: sort.key === key ? (sort.dir === 1 ? -1 : 1) : -1 })} className="inline-flex items-center gap-1 hover:text-foreground">{label}<ArrowUpDown className="h-3 w-3" /></button></th>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button key={r.id} type="button" onClick={() => setRange(r.id)} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", range === r.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-gold")}>{r.label}</button>
        ))}
        {range === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" aria-label="From date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
            <span className="text-sm text-muted-foreground">to</span>
            <Input type="date" aria-label="To date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" />
          </div>
        )}
      </div>

      {missingCost.length > 0 && (
        <div className="flex gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-gold-deep" />
          <div><p className="font-medium text-brown">Add a cost price to get accurate profit</p><p className="mt-1 text-muted-foreground">Missing for: {missingCost.slice(0, 8).join(", ")}{missingCost.length > 8 && ` and ${missingCost.length - 8} more`}. Set it in Products → Pricing & stock. Orders placed before you set a cost count as ₹0 cost.</p></div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card label="Sales" value={inr(report.sales)} note={`${report.orders} orders`} />
        <Card label="Returns" value={inr(report.returnsValue)} note={`${report.returnsCount} returned`} tone={report.returnsCount ? "bad" : undefined} />
        <Card label="Cost of goods" value={inr(report.cost)} note="From cost prices" />
        <Card label={report.profit >= 0 ? "Net profit" : "Net loss"} value={inr(Math.abs(report.profit))} note={`${margin.toFixed(1)}% margin`} tone={report.profit >= 0 ? "good" : "bad"} />
        <Card label="Avg. order" value={inr(report.orders ? Math.round(report.sales / report.orders) : 0)} note="Per order" />
      </div>

      <section className="rounded-xl bg-card p-5 shadow-warm">
        <h3 className="font-display text-xl font-semibold text-brown">Sales & returns</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" minTickGap={16} />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" tickFormatter={(v: number) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
              <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="sales" name="Sales" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returns" name="Returns" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl bg-card p-5 shadow-warm">
        <h3 className="font-display text-xl font-semibold text-brown">Profit & loss</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={report.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" minTickGap={16} />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" tickFormatter={(v: number) => `₹${Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
              <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="profit" name="Profit / loss" radius={[4, 4, 0, 0]}>
                {report.series.map((r) => <Cell key={r.key} fill={r.profit < 0 ? "var(--color-destructive)" : "var(--color-chart-1)"} />)}
              </Bar>
              <Line type="monotone" dataKey="sales" name="Sales" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cost" name="Cost" stroke="var(--color-chart-3)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl bg-card p-5 shadow-warm">
        <h3 className="font-display text-xl font-semibold text-brown">By pack size</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="py-3 text-left">Product</th>{head("units", "Units")}{head("sales", "Sales")}{head("cost", "Cost")}{head("profit", "Profit")}{head("margin", "Margin")}</tr></thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-3 font-medium text-foreground">{r.name}</td>
                  <td className="text-right">{r.units}</td><td className="text-right">{inr(r.sales)}</td><td className="text-right">{inr(r.cost)}</td>
                  <td className={cn("text-right font-semibold", r.profit < 0 ? "text-destructive" : "text-leaf")}>{inr(r.profit)}</td>
                  <td className="text-right">{r.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!table.length && <p className="py-10 text-center text-sm text-muted-foreground">No sales in this period</p>}
        </div>
      </section>
    </div>
  );
}

function Card({ label, value, note, tone }: { label: string; value: string; note: string; tone?: "good" | "bad" | undefined }) {
  return (
    <article className={cn("border-l-4 bg-card p-5 shadow-warm", tone === "bad" ? "border-destructive" : tone === "good" ? "border-leaf" : "border-gold")}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-3 font-display text-2xl font-semibold", tone === "bad" ? "text-destructive" : "text-brown")}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </article>
  );
}

export function SalesSparkChart({ orders }: { orders: Order[] }) {
  const data = useMemo(() => {
    const end = new Date(); const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 29);
    const rows = new Map(buckets(start, end, false).map((k) => [k, { label: fmtKey(k), sales: 0 }]));
    for (const o of orders) {
      if (o.status === "cancelled" || o.status === "returned") continue;
      const r = rows.get(dayKey(new Date(o.created_at))); if (r) r.sales += o.total;
    }
    return [...rows.values()];
  }, [orders]);
  return (
    <div className="mt-4 h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" minTickGap={20} />
          <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
          <Bar dataKey="sales" name="Sales" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
