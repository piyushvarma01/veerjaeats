import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FolderTree, Images, Image as ImageIcon, Settings, Star, BarChart3, Boxes, Check, ChevronRight, CircleDollarSign, Clock3, Film, ImagePlus, Inbox, LayoutDashboard, Loader2, LogOut, Menu, MessageSquareQuote, PackageCheck, Pencil, Plus, Save, Search, ShoppingBag, Trash2, Upload, Users, X, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { getAdminData, getAdminState, claimInitialAdmin, mutateAdminData, type AdminMutation } from "@/lib/admin.functions";
import { inr } from "@/lib/shop-data";
import { toWebP } from "@/lib/image-webp";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ProductsPanel } from "@/components/admin/ProductsPanel";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { BillsPanel } from "@/components/admin/BillsPanel";
import { GalleryPanel } from "@/components/admin/GalleryPanel";
import { ReportsPanel, SalesSparkChart } from "@/components/admin/ReportsPanel";
import { ComingSoon, type Mutate } from "@/components/admin/shared";

type Section = "dashboard" | "reports" | "products" | "categories" | "messages" | "reels" | "gallery" | "branding" | "website-images" | "orders" | "bills" | "customers" | "settings";
const NAV: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "products", label: "Products", icon: Boxes },
  { id: "categories", label: "Categories", icon: FolderTree }, { id: "messages", label: "Reviews / Messages", icon: MessageSquareQuote },
  { id: "reports", label: "Reports", icon: BarChart3 }, { id: "reels", label: "Reels", icon: Film }, { id: "gallery", label: "Gallery", icon: Images },
  { id: "branding", label: "Logo / Branding", icon: ImagePlus }, { id: "website-images", label: "Website Images", icon: ImageIcon },
  { id: "orders", label: "Orders", icon: ShoppingBag }, { id: "bills", label: "Bills & Labels", icon: Receipt }, { id: "customers", label: "Customers", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin Dashboard — Veerja Eats" }, { name: "description", content: "Manage Veerja Eats orders, products, customers, reviews, reels, and messages." },
    { property: "og:title", content: "Admin Dashboard — Veerja Eats" }, { property: "og:description", content: "Private Veerja Eats management workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate(); const queryClient = useQueryClient();
  const stateFn = useServerFn(getAdminState); const dataFn = useServerFn(getAdminData); const claimFn = useServerFn(claimInitialAdmin); const mutateFn = useServerFn(mutateAdminData);
  const [section, setSection] = useState<Section>("dashboard"); const [mobileNav, setMobileNav] = useState(false); const [search, setSearch] = useState("");
  const state = useQuery({ queryKey: ["admin-state"], queryFn: () => stateFn() });
  const data = useQuery({ queryKey: ["admin-data"], queryFn: () => dataFn(), enabled: state.data?.isAdmin === true });
  const mutation = useMutation({ mutationFn: (payload: AdminMutation) => mutateFn({ data: payload }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-data"] }); toast.success("Changes saved"); }, onError: (error) => toast.error(friendlyError(error)) });
  const title = NAV.find((item) => item.id === section)?.label ?? "Dashboard";
  const logout = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); };
  if (state.isLoading) return <LoadingScreen />;
  if (!state.data?.isAdmin) return <AccessSetup canClaim={Boolean(state.data?.canClaim)} onClaim={async () => { await claimFn(); await queryClient.invalidateQueries({ queryKey: ["admin-state"] }); }} onLogout={logout} />;
  const content = data.data;
  return <div className="min-h-screen bg-beige/55 text-foreground">
    <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 border-r border-cream/15 bg-brown text-cream transition-transform lg:translate-x-0", mobileNav ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-20 items-center justify-between border-b border-cream/15 px-5"><div className="flex min-w-0 items-center gap-3">{content?.settings?.logo_url ? <img src={content.settings.logo_url} alt="Veerja Eats" className="h-11 w-auto max-w-[160px] object-contain" /> : <><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold font-semibold text-brown">वी</span><div><p className="font-display text-xl font-semibold text-cream">Veerja Eats</p><p className="text-[10px] uppercase text-cream/70">Control room</p></div></>}</div><Button variant="ghost" size="icon" onClick={() => setMobileNav(false)} className="text-cream hover:bg-cream/10 hover:text-cream lg:hidden"><X /></Button></div>
      <nav className="space-y-1 p-3">{NAV.map(({ id, label, icon: Icon }) => <Button key={id} variant="ghost" onClick={() => { setSection(id); setMobileNav(false); }} className={cn("w-full justify-start text-cream/80 hover:bg-cream/10 hover:text-cream", section === id && "bg-gold text-brown hover:bg-gold hover:text-brown")}><Icon />{label}{id === "messages" && content && content.messages.filter((m) => m.status === "unread").length > 0 && <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs", section === id ? "bg-brown/15 text-brown" : "bg-cream/15 text-cream")}>{content.messages.filter((m) => m.status === "unread").length}</span>}</Button>)}</nav>
      <div className="absolute right-3 bottom-4 left-3"><Button variant="ghost" onClick={logout} className="w-full justify-start text-cream/80 hover:bg-cream/10 hover:text-cream"><LogOut /> Sign out</Button></div>
    </aside>
    <main className="min-w-0 lg:pl-64"><header className="sticky top-0 z-40 flex h-20 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-7"><Button variant="outline" size="icon" onClick={() => setMobileNav(true)} className="lg:hidden"><Menu /></Button><div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase text-gold-deep">Admin workspace</p><h1 className="truncate font-display text-2xl font-semibold text-brown">{title}</h1></div><a href="/" className="hidden text-sm font-medium text-muted-foreground hover:text-brown sm:block">View storefront</a></header>
      <div className="mx-auto max-w-[1500px] p-4 sm:p-7">{data.isLoading && <LoadingPanel />}{data.isError && <ErrorPanel message="The admin data could not be loaded." />}{content && <AdminContent section={section} data={content} search={search} setSearch={setSearch} mutate={(payload) => mutation.mutate(payload)} run={(payload) => mutation.mutateAsync(payload).catch(() => undefined)} busy={mutation.isPending} />}</div>
    </main><Toaster position="bottom-right" />
  </div>;
}

function friendlyError(error: unknown) {
  const raw = error instanceof Error ? error.message : "";
  if (/duplicate key|already exists/i.test(raw)) return "That web address or SKU is already used by another product. Change it and try again.";
  if (raw.trim().startsWith("[")) {
    try {
      const issues = JSON.parse(raw) as { path?: (string | number)[]; message?: string }[];
      const first = issues[0];
      if (first) return `Please check "${String(first.path?.filter((p) => typeof p === "string").pop() ?? "form")}": ${first.message ?? "invalid value"}`;
    } catch { /* fall through */ }
  }
  return raw || "Could not save changes";
}
function LoadingScreen() { return <main className="grid min-h-screen place-items-center bg-beige"><Loader2 className="h-8 w-8 animate-spin text-gold-deep" /></main>; }
function LoadingPanel() { return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-gold-deep" /></div>; }
function ErrorPanel({ message }: { message: string }) { return <div className="rounded-lg border border-destructive/25 bg-card p-8 text-center text-destructive">{message}</div>; }
function AccessSetup({ canClaim, onClaim, onLogout }: { canClaim: boolean; onClaim: () => Promise<void>; onLogout: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return <main className="grid min-h-screen place-items-center bg-beige px-4"><section className="max-w-lg rounded-lg border border-border bg-card p-8 text-center shadow-warm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/20 text-gold-deep"><PackageCheck /></span><h1 className="mt-5 font-display text-3xl font-semibold text-brown">{canClaim ? "Set up the first admin" : "Access restricted"}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{canClaim ? "No administrator exists yet. Claim this workspace with your signed-in account." : "Your account is signed in, but it does not have administrator access."}</p><div className="mt-6 flex justify-center gap-3">{canClaim && <Button disabled={busy} onClick={async () => { setBusy(true); await onClaim(); setBusy(false); }} className="bg-brown text-primary-foreground hover:bg-brown/90">{busy ? <Loader2 className="animate-spin" /> : <Check />}Claim admin access</Button>}<Button variant="outline" onClick={onLogout}>Sign out</Button></div></section></main>;
}

type AdminData = Awaited<ReturnType<typeof getAdminData>>;
type MutationPayload = AdminMutation;
function AdminContent({ section, data, search, setSearch, mutate, run, busy }: { section: Section; data: AdminData; search: string; setSearch: (value: string) => void; mutate: (data: MutationPayload) => void; run: Mutate; busy: boolean }) {
  const orders = data.orders; const revenue = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
  if (section === "dashboard") return <Dashboard data={data} revenue={revenue} mutate={mutate} busy={busy} />;
  if (section === "categories") return <CategoriesPanel categories={data.categories} products={data.products} mutate={run} />;
  if (section === "bills") return <BillsPanel orders={orders} />;
  if (section === "gallery") return <GalleryPanel />;
  if (section === "reports") return <ReportsPanel orders={data.orders} products={data.products} />;
  if (section === "website-images") return <ComingSoon title="Website Images" />;
  if (section === "settings") return <ComingSoon title="Settings" />;
  if (section === "orders") { const filtered = orders.filter((o) => `${o.order_number} ${o.customers?.full_name ?? ""} ${o.customers?.mobile ?? ""}`.toLowerCase().includes(search.toLowerCase())); return <section className="bg-card p-5 shadow-warm"><SectionTitle title="Orders" subtitle="Track, search, and fulfil customer orders" search={search} setSearch={setSearch} /><OrdersTable orders={filtered} mutate={mutate} busy={busy} /></section>; }
  if (section === "products") return <ProductsPanel products={data.products} categories={data.categories} mutate={run} />;
  if (section === "customers") return <section className="bg-card p-5 shadow-warm"><SectionTitle title="Customers" subtitle="Customer contacts and purchase history" /><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="py-3">Customer</th><th>Contact</th><th>Location</th><th>Orders</th><th>Total spent</th></tr></thead><tbody>{data.customers.map((c) => <tr key={c.id} className="border-b border-border/60"><td className="py-4 font-medium text-brown">{c.full_name}</td><td><p>{c.email}</p><p className="text-muted-foreground">{c.mobile}</p></td><td>{c.city}, {c.state}</td><td>{c.orders.length}</td><td className="font-semibold">{inr(c.orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0))}</td></tr>)}</tbody></table><Empty show={!data.customers.length} label="No customers yet" /></div></section>;
  if (section === "reels") return <ReelsPanel reels={data.reels} mutate={mutate} busy={busy} />;
  if (section === "branding") return <BrandingPanel logoUrl={data.settings?.logo_url ?? null} mutate={mutate} busy={busy} />;

  return <><section className="bg-card p-5 shadow-warm"><SectionTitle title="Customer messages" subtitle="Read and resolve storefront enquiries" /><div className="mt-5 grid gap-3">{data.messages.map((message) => <article key={message.id} className="grid gap-3 border-b border-border p-4 lg:grid-cols-[220px_1fr_auto]"><div><p className="font-semibold text-brown">{message.name}</p><p className="text-xs text-muted-foreground">{message.email}</p><p className="text-xs text-muted-foreground">{message.phone}</p></div><div><div className="flex gap-2"><h3 className="font-medium">{message.subject}</h3><Status value={message.status} /></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{message.message}</p></div><Select value={message.status} onValueChange={(value: "unread" | "read" | "resolved") => mutate({ action: "messageStatus", id: message.id, value })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unread">Unread</SelectItem><SelectItem value="read">Read</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select></article>)}<Empty show={!data.messages.length} label="Inbox is clear" /></div></section>
  <section className="mt-6 bg-card p-5 shadow-warm"><SectionTitle title="Website review messages" subtitle="Every review shown on the website — edit the words, rating or visibility here" /><div className="mt-5 grid gap-4 xl:grid-cols-2">{data.reviews.map((review) => <ReviewEditor key={review.id} review={review} mutate={mutate} busy={busy} />)}<Empty show={!data.reviews.length} label="No website reviews yet" /></div></section></>;
}

function Dashboard({ data, revenue, mutate, busy }: { data: AdminData; revenue: number; mutate: (data: MutationPayload) => void; busy: boolean }) {
  const recentProducts = [...data.products].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Boxes} label="Total products" value={String(data.products.length)} note={`${data.products.filter((p) => p.is_active).length} live on website`} />
      <Metric icon={FolderTree} label="Categories" value={String(data.categories.length)} note={`${data.categories.filter((c) => c.is_published).length} published`} />
      <Metric icon={MessageSquareQuote} label="Reviews" value={String(data.reviews.length)} note={`${data.reviews.filter((r) => r.status === "pending").length} waiting for approval`} />
      <Metric icon={Film} label="Reels" value={String(data.reels.length)} note={`${data.reels.filter((r) => r.is_published).length} published`} />
      <Metric icon={ShoppingBag} label="Orders" value={String(data.orders.length)} note={`${data.orders.filter((o) => o.status === "new").length} awaiting action`} />
      <Metric icon={CircleDollarSign} label="Revenue" value={inr(revenue)} note="Non-cancelled orders" />
      <Metric icon={Users} label="Customers" value={String(data.customers.length)} note="All-time customers" />
      <Metric icon={Inbox} label="Unread messages" value={String(data.messages.filter((m) => m.status === "unread").length)} note="From the contact form" />
    </div>
    <section className="mt-6 rounded-xl bg-card p-5 shadow-warm"><SectionTitle title="Sales — last 30 days" subtitle="Open Reports for returns and profit" /><SalesSparkChart orders={data.orders} /></section>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="rounded-xl bg-card p-5 shadow-warm"><SectionTitle title="Recently added products" subtitle="Newest items in your catalogue" /><div className="mt-4 divide-y divide-border">{recentProducts.map((p) => <div key={p.id} className="flex items-center gap-3 py-3"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-beige">{p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-contain" />}</span><div className="min-w-0 flex-1"><p className="truncate font-medium text-brown">{p.name}</p><p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-IN")}</p></div><Status value={p.is_active ? "published" : "draft"} /></div>)}<Empty show={!recentProducts.length} label="No products yet" /></div></section>
      <section className="rounded-xl bg-card p-5 shadow-warm"><SectionTitle title="Recent reviews" subtitle="Latest customer feedback" /><div className="mt-4 divide-y divide-border">{data.reviews.slice(0, 5).map((r) => <div key={r.id} className="py-3"><div className="flex items-center gap-2"><p className="font-medium text-brown">{r.customer_name}</p><span className="flex text-gold">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</span><span className="ml-auto"><Status value={r.status} /></span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.review}</p></div>)}<Empty show={!data.reviews.length} label="No reviews yet" /></div></section>
    </div>
    <section className="mt-6 rounded-xl bg-card p-5 shadow-warm"><SectionTitle title="Recent orders" subtitle="Latest purchases across the store" /><OrdersTable orders={data.orders.slice(0, 6)} mutate={mutate} busy={busy} /></section>
  </>;
}
function Metric({ icon: Icon, label, value, note }: { icon: typeof BarChart3; label: string; value: string; note: string }) { return <article className="border-l-4 border-gold bg-card p-5 shadow-warm"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="h-5 w-5 text-gold-deep" /></div><p className="mt-4 font-display text-3xl font-semibold text-brown">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></article>; }
function SectionTitle({ title, subtitle, search, setSearch }: { title: string; subtitle: string; search?: string; setSearch?: (value: string) => void }) { return <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold text-brown">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>{setSearch && <div className="relative"><Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders" className="w-64 pl-9" /></div>}</div>; }
function Status({ value }: { value: string }) { const good = ["approved", "delivered", "resolved", "published"].includes(value); const pending = ["new", "pending", "unread"].includes(value); return <span className={cn("inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase", good ? "bg-leaf/12 text-leaf" : pending ? "bg-gold/20 text-gold-deep" : "bg-secondary text-muted-foreground")}>{value}</span>; }
function Empty({ show, label }: { show: boolean; label: string }) { return show ? <div className="py-14 text-center text-sm text-muted-foreground">{label}</div> : null; }
function ReviewsPanel({ reviews, mutate, busy }: { reviews: AdminData["reviews"]; mutate: (data: MutationPayload) => void; busy: boolean }) {
  return <section className="bg-card p-5 shadow-warm"><SectionTitle title="Customer reviews" subtitle="Edit every detail and choose what appears on the storefront" /><div className="mt-5 grid gap-4 xl:grid-cols-2">{reviews.map((review) => <ReviewEditor key={review.id} review={review} mutate={mutate} busy={busy} />)}<Empty show={!reviews.length} label="No customer reviews yet" /></div></section>;
}
function ReviewEditor({ review, mutate, busy }: { review: AdminData["reviews"][number]; mutate: (data: MutationPayload) => void; busy: boolean }) {
  const [customerName, setCustomerName] = useState(review.customer_name); const [city, setCity] = useState(review.city);
  const [rating, setRating] = useState(String(review.rating)); const [text, setText] = useState(review.review); const [status, setStatus] = useState(review.status);
  return <article className="border border-border bg-background p-4">
    <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="text-gold-deep">{"★".repeat(Number(rating) || 0)}</span><Status value={status} /></div><Button size="icon" variant="ghost" aria-label="Delete review" disabled={busy} onClick={async () => { if (!confirm(`Delete the review from ${customerName} with all its photos and videos?`)) return; const paths = review.review_media.map((m) => m.storage_path); if (paths.length) await supabase.storage.from("review-media").remove(paths); mutate({ action: "deleteReview", id: review.id }); }}><Trash2 /></Button></div>
    {(review.products?.name || review.order_id) && <p className="-mt-2 mb-3 text-xs text-muted-foreground">{review.products?.name && <>For <span className="font-medium text-foreground">{review.products.name}</span></>}{review.order_id && <span className="ml-2 rounded bg-leaf/12 px-1.5 py-0.5 font-semibold text-leaf">Verified buyer</span>}</p>}
    <ReviewMedia media={review.review_media} />
    <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor={`review-name-${review.id}`}>Customer name</Label><Input id={`review-name-${review.id}`} value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div><div><Label htmlFor={`review-city-${review.id}`}>City</Label><Input id={`review-city-${review.id}`} value={city} onChange={(e) => setCity(e.target.value)} /></div><div><Label htmlFor={`review-rating-${review.id}`}>Rating</Label><Select value={rating} onValueChange={setRating}><SelectTrigger id={`review-rating-${review.id}`}><SelectValue /></SelectTrigger><SelectContent>{[5, 4, 3, 2, 1].map((value) => <SelectItem key={value} value={String(value)}>{value} stars</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor={`review-status-${review.id}`}>Visibility</Label><Select value={status} onValueChange={(value: "pending" | "approved" | "rejected") => setStatus(value)}><SelectTrigger id={`review-status-${review.id}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Published</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Hidden</SelectItem></SelectContent></Select></div></div>
    <div className="mt-3"><Label htmlFor={`review-text-${review.id}`}>Review message</Label><Textarea id={`review-text-${review.id}`} rows={4} value={text} onChange={(e) => setText(e.target.value)} /></div>
    <Button className="mt-4 bg-leaf text-accent-foreground hover:bg-leaf/90" disabled={busy || customerName.trim().length < 2 || text.trim().length < 2} onClick={() => mutate({ action: "updateReview", id: review.id, customerName: customerName.trim(), city: city.trim(), rating: Number(rating), review: text.trim(), status })}>{busy ? <Loader2 className="animate-spin" /> : <Save />}Save review</Button>
  </article>;
}
function OrdersTable({ orders, mutate, busy }: { orders: AdminData["orders"]; mutate: (data: MutationPayload) => void; busy: boolean }) { return <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="py-3">Order</th><th>Customer</th><th>Items</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-border/60"><td className="py-4 font-semibold text-brown">#{order.order_number}</td><td><p>{order.customers?.full_name}</p><p className="text-xs text-muted-foreground">{order.customers?.mobile}</p></td><td>{order.order_items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>{new Date(order.created_at).toLocaleDateString("en-IN")}</td><td className="font-semibold">{inr(order.total)}</td><td><Select disabled={busy} value={order.status} onValueChange={(value: "new" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned") => mutate({ action: "orderStatus", id: order.id, value })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{["new", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></td></tr>)}</tbody></table><Empty show={!orders.length} label="No orders found" /></div>; }

function ReelsPanel({ reels, mutate, busy }: { reels: AdminData["reels"]; mutate: (data: MutationPayload) => void; busy: boolean }) { const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); mutate({ action: "addReel", title: String(form.get("title")), mediaUrl: String(form.get("mediaUrl")), caption: String(form.get("caption")), published: form.get("published") === "on" }); event.currentTarget.reset(); }; return <div className="grid gap-5 xl:grid-cols-[380px_1fr]"><form onSubmit={submit} className="bg-card p-5 shadow-warm"><SectionTitle title="Add reel" subtitle="Publish short-form brand content" /><div className="mt-5 space-y-4"><div><Label htmlFor="reel-title">Title</Label><Input id="reel-title" name="title" required minLength={2} /></div><div><Label htmlFor="media-url">Media URL</Label><Input id="media-url" name="mediaUrl" type="url" required /></div><div><Label htmlFor="caption">Caption</Label><Textarea id="caption" name="caption" /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" /> Publish now</label><Button type="submit" disabled={busy} className="w-full">Add reel</Button></div></form><section className="bg-card p-5 shadow-warm"><SectionTitle title="Reel library" subtitle="Manage visibility and remove old content" /><div className="mt-5 space-y-3">{reels.map((reel) => <div key={reel.id} className="flex items-center gap-3 border-b border-border p-3"><Film className="text-gold-deep" /><div className="min-w-0 flex-1"><p className="truncate font-medium text-brown">{reel.title}</p><p className="truncate text-xs text-muted-foreground">{reel.media_url}</p></div><Button size="sm" variant="outline" onClick={() => mutate({ action: "toggleReel", id: reel.id, value: !reel.is_published })}>{reel.is_published ? "Published" : "Draft"}</Button><Button size="icon" variant="ghost" aria-label="Delete reel" onClick={() => mutate({ action: "deleteReel", id: reel.id })}><Trash2 /></Button></div>)}<Empty show={!reels.length} label="No reels added" /></div></section></div>; }
async function uploadSiteLogo(original: File) {
  if (!original.type.startsWith("image/")) { toast.error("Choose a JPG, PNG, WebP or SVG image"); return null; }
  if (original.size > 8 * 1024 * 1024) { toast.error("Logo must be smaller than 8 MB"); return null; }
  const file = await toWebP(original, 0.92, 1200);
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `logo-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, { contentType: file.type, upsert: false });
  if (error) { toast.error("Logo upload failed", { description: error.message }); return null; }
  return `/api/public/site-image?path=${encodeURIComponent(path)}`;
}

function BrandingPanel({ logoUrl, mutate, busy }: { logoUrl: string | null; mutate: (data: MutationPayload) => void; busy: boolean }) {
  const [uploading, setUploading] = useState(false);
  const pick = async (file: File) => {
    setUploading(true);
    const url = await uploadSiteLogo(file);
    setUploading(false);
    if (url) mutate({ action: "updateLogo", logoUrl: url });
  };
  return <section className="max-w-2xl bg-card p-5 shadow-warm">
    <SectionTitle title="Website logo" subtitle="Upload the logo shown in the website header and footer" />
    <div className="mt-6 flex flex-wrap items-center gap-6">
      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-gold-deep/35 bg-beige/60 overflow-hidden">
        {logoUrl ? <img src={logoUrl} alt="Current website logo" className="h-full w-full object-cover" /> : <span className="font-display text-3xl font-semibold text-gold-deep">वी</span>}
      </div>
      <div className="space-y-3">
        <label htmlFor="logo-file" className="flex cursor-pointer items-center gap-2 border border-dashed border-gold-deep/45 bg-beige/55 px-4 py-3 text-sm font-medium text-brown hover:bg-gold/10">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading logo…" : logoUrl ? "Replace logo" : "Upload logo"}
        </label>
        <Input id="logo-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" disabled={uploading || busy}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) void pick(file); }} />
        <p className="text-xs text-muted-foreground">Square images work best. Max 2 MB.</p>
        {logoUrl && <Button variant="outline" disabled={busy} onClick={() => mutate({ action: "updateLogo", logoUrl: "" })}>Remove logo</Button>}
      </div>
    </div>
  </section>;
}

function ReviewMedia({ media }: { media: { id: string; kind: string; storage_path: string; sort_order: number }[] }) {
  const qc = useQueryClient();
  const urls = useQuery({
    queryKey: ["review-media-urls", media.map((m) => m.id).join(",")],
    enabled: media.length > 0,
    queryFn: async () => {
      const { data } = await supabase.storage.from("review-media").createSignedUrls(media.map((m) => m.storage_path), 3600);
      return Object.fromEntries((data ?? []).map((d) => [d.path ?? "", d.signedUrl]));
    },
  });
  if (!media.length) return null;
  const remove = async (m: { id: string; storage_path: string }) => {
    if (!confirm("Delete this photo/video from the review?")) return;
    const { error } = await supabase.from("review_media").delete().eq("id", m.id);
    if (error) { toast.error("Could not delete"); return; }
    await supabase.storage.from("review-media").remove([m.storage_path]);
    toast.success("Removed"); void qc.invalidateQueries({ queryKey: ["admin-data"] });
  };
  return <div className="mb-4 flex flex-wrap gap-2">{[...media].sort((a, b) => a.sort_order - b.sort_order).map((m) => { const url = urls.data?.[m.storage_path]; return <div key={m.id} className="relative h-24 w-24 overflow-hidden rounded-md border border-border bg-secondary">{url ? (m.kind === "photo" ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Review upload" className="h-full w-full object-cover" /></a> : <video src={url} controls className="h-full w-full object-cover" />) : <Loader2 className="m-auto mt-8 h-5 w-5 animate-spin text-gold-deep" />}<button type="button" aria-label="Delete media" onClick={() => void remove(m)} className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div>; })}</div>;
}
