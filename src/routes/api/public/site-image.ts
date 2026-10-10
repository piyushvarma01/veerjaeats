import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/site-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const path = new URL(request.url).searchParams.get("path");
        if (!path || path.includes("..") || path.startsWith("/")) {
          return new Response("Invalid image path", { status: 400 });
        }

        const imageUrl = `/api/public/site-image?path=${encodeURIComponent(path)}`;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [{ data: settings }, { data: gallery }] = await Promise.all([
          supabaseAdmin.from("site_settings").select("id").eq("logo_url", imageUrl).maybeSingle(),
          supabaseAdmin.from("gallery_images").select("id").eq("image_url", imageUrl).maybeSingle(),
        ]);

        if (!settings && !gallery) return new Response("Image not found", { status: 404 });

        const { data, error } = await supabaseAdmin.storage.from("site-assets").download(path);
        if (error || !data) return new Response("Image not found", { status: 404 });

        return new Response(data, {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
