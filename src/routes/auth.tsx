import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [
    { title: "Sign In — Veerja Eats" },
    { name: "description", content: "Sign in to Veerja Eats to see your orders and review products." },
    { property: "og:title", content: "Sign In — Veerja Eats" },
    { property: "og:description", content: "Your Veerja Eats account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const go = async () => {
      const { data } = await supabase.auth.getUser();
      const next = sessionStorage.getItem("veerja-after-login");
      if (data.user && next) { sessionStorage.removeItem("veerja-after-login"); await navigate({ to: next }); }
    };
    void go();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === "SIGNED_IN") void go(); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? ""); const password = String(form.get("password") ?? "");
    const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/account" } });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("Check your email to confirm your account, then sign in.");
    const next = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/account";
    await navigate({ to: next });
  };
  return <main className="grid min-h-screen place-items-center bg-beige px-4 py-10">
    <section className="w-full max-w-md rounded-lg border border-border bg-card p-7 shadow-warm-lg sm:p-9">
      <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brown"><ArrowLeft className="h-4 w-4" /> Storefront</a>
      <div className="mt-7 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-gold text-lg font-semibold text-primary-foreground">वी</span><div><p className="font-display text-2xl font-semibold text-brown">Veerja Eats</p><p className="text-xs text-muted-foreground">Your orders & reviews</p></div></div>
      <h1 className="mt-8 font-display text-3xl font-semibold text-brown">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <Button type="button" variant="outline" className="mt-6 w-full" disabled={busy} onClick={async () => {
        const next = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/account";
        sessionStorage.setItem("veerja-after-login", next);
        const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
        if (r.error) setMessage(r.error.message);
      }}>Continue with Google</Button>
      <p className="mt-4 text-center text-xs text-muted-foreground">or use your email</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" required className="mt-1.5" /></div>
        <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" minLength={8} required className="mt-1.5" /></div>
        {message && <p className="rounded-md bg-secondary px-3 py-2 text-sm text-foreground">{message}</p>}
        <Button type="submit" disabled={busy} className="w-full bg-brown text-primary-foreground hover:bg-brown/90">{busy ? <Loader2 className="animate-spin" /> : <LockKeyhole />}{mode === "signin" ? "Sign in" : "Sign up"}</Button>
      </form>
      <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="mt-5 w-full text-center text-sm text-gold-deep hover:underline">{mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button>
    </section>
  </main>;
}