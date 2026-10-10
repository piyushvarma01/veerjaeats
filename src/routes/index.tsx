import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart-context";
import { SiteImagesProvider } from "@/lib/site-images";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Benefits } from "@/components/site/Benefits";
import { ProductSection } from "@/components/site/ProductSection";
import { ProductCatalog } from "@/components/site/ProductCatalog";
import { WhyUs } from "@/components/site/WhyUs";
import { Process } from "@/components/site/Process";
import { Showcase } from "@/components/site/Showcase";
import { Testimonials } from "@/components/site/Testimonials";
import { FaqSection } from "@/components/site/FaqSection";
import { FinalCta } from "@/components/site/FinalCta";
import { ContactSection } from "@/components/site/ContactSection";
import { Footer } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { Checkout } from "@/components/site/Checkout";
import { OrderSuccess } from "@/components/site/OrderSuccess";
import { getApprovedReviews, getStorefrontProducts, getSiteSettings, getGalleryImages, getSiteImages } from "@/lib/storefront.functions";

const TITLE = "Veerja Eats | Premium A2 Cow Ghee, Bilona Churned";
const DESCRIPTION =
  "Buy Veerja Eats premium A2 cow ghee — hand-churned by the traditional bilona method from free-grazing desi cow milk. 250ml, 500ml & 1L jars, free delivery in India.";

const reviewsQuery = queryOptions({
  queryKey: ["storefront-reviews"],
  queryFn: () => getApprovedReviews(),
});

const productsQuery = queryOptions({
  queryKey: ["storefront-products"],
  queryFn: () => getStorefrontProducts(),
});

const settingsQuery = queryOptions({
  queryKey: ["storefront-settings"],
  queryFn: () => getSiteSettings(),
});


const galleryQuery = queryOptions({
  queryKey: ["storefront-gallery"],
  queryFn: () => getGalleryImages(),
});

const siteImagesQuery = queryOptions({ queryKey: ["storefront-site-images"], queryFn: () => getSiteImages() });

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(reviewsQuery),
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(galleryQuery),
      context.queryClient.ensureQueryData(siteImagesQuery),
    ]);

  },
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const { data: reviews } = useSuspenseQuery(reviewsQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: gallery } = useSuspenseQuery(galleryQuery);
  const { data: siteImages } = useSuspenseQuery(siteImagesQuery);
  return (
    <SiteImagesProvider images={siteImages}>
    <CartProvider>
      <div className="min-h-screen overflow-x-hidden bg-background">
        <Header logoUrl={settings.logoUrl} />

        <main>
          <Hero />
          <Benefits />
          {products.length > 0 ? <ProductCatalog products={products} /> : <ProductSection />}
          <WhyUs />
          <Process />
          <Showcase images={gallery} />
          <Testimonials reviews={reviews} />
          <FaqSection />
          <FinalCta />
          <ContactSection />
        </main>
        <Footer logoUrl={settings.logoUrl} />
        <CartDrawer />
        <Checkout />
        <OrderSuccess />
        <Toaster position="bottom-right" />
      </div>
    </CartProvider>
    </SiteImagesProvider>
  );
}
