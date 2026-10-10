import { createFileRoute } from "@tanstack/react-router";

// Serves review photos/videos only when they belong to an approved review,
// or when the request carries an admin's session token.
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
        let allowed = (media.reviews as { status: string } | null)?.status === "approved";
        if (!allowed) {
          const token = url.searchParams.get("token");
          if (token) {
            const { data: u } = await supabaseAdmin.auth.getUser(token);
            if (u.user) {
              const { data: role } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
              allowed = Boolean(role);
            }
          }
        }
        if (!allowed) return new Response("Not found", { status: 404 });
        const { data, error } = await supabaseAdmin.storage.from("review-media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": allowed ? "private, max-age=600" : "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
