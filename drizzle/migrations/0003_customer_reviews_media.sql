ALTER TABLE public.orders ADD COLUMN user_id uuid;
CREATE INDEX orders_user_id_idx ON public.orders(user_id);
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Customers view own order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

ALTER TABLE public.reviews ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN user_id uuid;
CREATE UNIQUE INDEX reviews_order_product_uniq ON public.reviews(order_id, product_id) WHERE order_id IS NOT NULL;
CREATE INDEX reviews_product_idx ON public.reviews(product_id);
CREATE POLICY "Customers view own reviews" ON public.reviews FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.review_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photo','video')),
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX review_media_review_idx ON public.review_media(review_id);
GRANT SELECT ON public.review_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_media TO authenticated;
GRANT ALL ON public.review_media TO service_role;
ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view approved review media" ON public.review_media FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_media.review_id AND (r.status = 'approved' OR r.user_id = auth.uid())) OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage review media" ON public.review_media FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));