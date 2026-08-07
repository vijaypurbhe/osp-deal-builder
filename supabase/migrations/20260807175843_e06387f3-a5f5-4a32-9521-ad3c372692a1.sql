ALTER TABLE public.towers DROP CONSTRAINT IF EXISTS towers_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS towers_deal_key_unique ON public.towers (deal_id, key);