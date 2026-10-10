import { createFileRoute } from "@tanstack/react-router";

// Serves review photos/videos only when they belong to an approved review.
export const Route = createFileRoute("/api/public/review-media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const path = url.searchParams.get("path");
        if (!path || path.includes("..") || path.startsWith("/")) return new Response("Invalid path", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: media } = await supabaseAdmin.from("review_media")
          .select("id,reviews(status)").eq("storage_path", path).maybeSingle();
        if (!media) return new Response("Not found", { status: 404 });
        const allowed = (media.reviews as { status: string } | null)?.status === "approved";
        if (!allowed) return new Response("Not found", { status: 404 });
        const { data, error } = await supabaseAdmin.storage.from("review-media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=3600",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
