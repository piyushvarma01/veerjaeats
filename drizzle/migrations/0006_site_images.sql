CREATE TABLE public.site_images (
  slot text PRIMARY KEY,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;
GRANT ALL ON public.site_images TO service_role;
ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view site images" ON public.site_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage site images" ON public.site_images FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER site_images_updated_at BEFORE UPDATE ON public.site_images FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();