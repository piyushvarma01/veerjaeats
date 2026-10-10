import { useEffect, useState } from "react";
import { Menu, Moon, ShoppingBag, Sun, User, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Our Ghee", href: "#our-ghee" },
  { label: "Why Veerja Eats", href: "#why" },
  { label: "Our Process", href: "#process" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function Header({ logoUrl }: { logoUrl?: string | null }) {
  const { count, openCart } = useCart();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("veerja-theme");
    const enabled = saved === "dark";
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const toggleTheme = () => {
    const enabled = !dark;
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
    localStorage.setItem("veerja-theme", enabled ? "dark" : "light");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/85 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:py-4">
        <a href="#home" className="flex min-w-0 items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Veerja Eats" className="h-11 w-auto max-w-44 object-contain" />
          ) : (
            <>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-base font-semibold text-primary-foreground shadow-warm">
                वी
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-xl leading-none font-semibold tracking-tight text-brown">
                  Veerja Eats
                </span>
                <span className="block text-[10px] tracking-[0.28em] text-muted-foreground uppercase">
                  A2 Cow Ghee
                </span>
              </span>
            </>
          )}
        </a>

        <nav className="hidden justify-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-foreground/75 transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:text-brown hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <a href="/account" aria-label="My account and orders" title="My account" className="grid h-10 w-10 place-items-center rounded-md text-foreground hover:bg-accent">
            <User className="h-5 w-5" />
          </a>
          <Button size="icon" variant="ghost" onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="relative h-10 w-16 rounded-full border border-border bg-secondary text-foreground">
            <Sun className="absolute left-2 h-4 w-4" />
            <Moon className="absolute right-2 h-4 w-4" />
            <span className={cn("absolute top-1 h-8 w-8 rounded-full bg-card shadow-sm transition-transform motion-reduce:transition-none", dark ? "translate-x-3" : "-translate-x-3")}>
              {dark ? <Moon className="m-2 h-4 w-4" /> : <Sun className="m-2 h-4 w-4" />}
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={openCart}
            aria-label={`Open cart, ${count} items`}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-brown transition-all hover:border-gold hover:shadow-warm"
          >
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-deep px-1 text-[11px] font-semibold text-primary-foreground"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          <Button
            asChild
            className="hidden bg-gradient-to-r from-gold to-gold-deep text-primary-foreground shadow-warm hover:opacity-95 sm:inline-flex"
          >
            <a href="#our-ghee">Shop Now</a>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-brown lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col px-4 py-2 sm:px-6">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-3 text-sm font-medium text-foreground/80 last:border-0"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
