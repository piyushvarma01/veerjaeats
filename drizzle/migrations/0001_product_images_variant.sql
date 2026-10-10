ALTER TABLE public.product_images ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;
CREATE INDEX product_images_variant_idx ON public.product_images(variant_id);