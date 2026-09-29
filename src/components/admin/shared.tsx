import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import type { AdminMutation, getAdminData } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;
export type AdminProduct = AdminData["products"][number];
export type AdminCategory = AdminData["categories"][number];
export type MutateResult = { ok: boolean; id?: string | null } | undefined;
export type Mutate = (payload: AdminMutation) => Promise<MutateResult>;

export const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function uploadProductImage(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); return null; }
  if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is larger than 5 MB`); return null; }
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) { toast.error("Image upload failed", { description: error.message }); return null; }
  return `/api/public/product-image?path=${encodeURIComponent(path)}`;
}

export function StatusPill({ value, tone }: { value: string; tone?: "good" | "warn" | "muted" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      tone === "good" && "bg-leaf/12 text-leaf",
      tone === "warn" && "bg-gold/20 text-gold-deep",
      (!tone || tone === "muted") && "bg-secondary text-muted-foreground",
    )}>{value}</span>
  );
}

export function Confirm({ title, description, onConfirm, children, label = "Delete" }: {
  title: string; description: string; onConfirm: () => void; children: ReactNode; label?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PanelHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-brown">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async <T,>(fn: () => Promise<T>) => { setBusy(true); try { return await fn(); } finally { setBusy(false); } };
  return { busy, run };
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="grid min-h-[50vh] place-items-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <div>
        <h2 className="font-display text-2xl font-semibold text-brown">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">This section is coming in the next phase of the admin panel.</p>
      </div>
    </section>
  );
}
