DROP POLICY IF EXISTS "Permitir leitura de status do pedido por external_id" ON public.orders;
REVOKE SELECT ON public.orders FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_order_status(p_external_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.orders WHERE external_id = p_external_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_order_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status(text) TO anon, authenticated;