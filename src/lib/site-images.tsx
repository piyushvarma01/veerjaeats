import { createContext, useContext, type ReactNode } from "react";

import farm from "@/assets/farm.jpg";
import texture from "@/assets/ghee-texture.jpg";
import jar from "@/assets/ghee-jar.jpg";

/** Every replaceable photo slot on the storefront, with its built-in default. */
export const SITE_IMAGE_SLOTS = [
  { slot: "hero", label: "Top banner (hero)", section: "Home — top", fallback: jar },
  { slot: "showcase-farm", label: "Gallery — large photo", section: "The Veerja World", fallback: farm },
  { slot: "showcase-texture", label: "Gallery — texture photo", section: "The Veerja World", fallback: texture },
  { slot: "showcase-jar", label: "Gallery — kitchen photo", section: "The Veerja World", fallback: jar },
  { slot: "final-cta", label: "Bottom banner", section: "Home — bottom", fallback: jar },
  { slot: "product-placeholder", label: "Product placeholder", section: "Products without photos", fallback: jar },
] as const;

export type SiteImageSlot = (typeof SITE_IMAGE_SLOTS)[number]["slot"];
type Map = Partial<Record<string, string>>;

const Ctx = createContext<Map>({});

export function SiteImagesProvider({ images, children }: { images: Map; children: ReactNode }) {
  return <Ctx.Provider value={images}>{children}</Ctx.Provider>;
}

export function useSiteImage(slot: SiteImageSlot) {
  const map = useContext(Ctx);
  return map[slot] ?? SITE_IMAGE_SLOTS.find((s) => s.slot === slot)!.fallback;
}
