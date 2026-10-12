import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SettingsPanel({ onLogout }: { onLogout: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const signOut = async () => {
    setBusy(true);
    try { await onLogout(); }
    catch { toast.error("Could not sign out. Please try again."); }
    finally { setBusy(false); }
  };
  return (
    <section className="min-w-0">
      <h2 className="font-display text-2xl font-semibold text-foreground">Account & session</h2>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-y border-border py-5">
        <p className="min-w-0 font-medium text-foreground">Admin account</p>
        <Button variant="outline" disabled={busy} onClick={signOut} className="shrink-0">
          {busy ? <Loader2 className="animate-spin" /> : <LogOut />} Sign out
        </Button>
      </div>
    </section>
  );
}