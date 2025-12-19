-- Add product_id foreign key to agrochemicals_used table
ALTER TABLE public.agrochemicals_used
  ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Add cost_per_unit for price snapshot
ALTER TABLE public.agrochemicals_used
  ADD COLUMN cost_per_unit NUMERIC(10,2);

-- Create index for faster joins
CREATE INDEX idx_agrochemicals_product_id ON public.agrochemicals_used(product_id);

-- Add comment to explain the nullable product_id
COMMENT ON COLUMN public.agrochemicals_used.product_id IS 'FK to products table. Null for manual entries or legacy data. When set, product info comes from the products catalog.';
COMMENT ON COLUMN public.agrochemicals_used.cost_per_unit IS 'Snapshot of product cost at time of application. Used for job costing.';
