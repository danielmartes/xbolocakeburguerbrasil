
DROP POLICY IF EXISTS "Anyone can read orders by id" ON public.orders;
REVOKE SELECT ON public.orders FROM anon;
REVOKE SELECT ON public.orders FROM authenticated;
