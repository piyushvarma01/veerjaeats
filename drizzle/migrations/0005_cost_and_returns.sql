ALTER TABLE public.product_variants ADD COLUMN cost_price integer NOT NULL DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN unit_cost integer NOT NULL DEFAULT 0;
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'returned';