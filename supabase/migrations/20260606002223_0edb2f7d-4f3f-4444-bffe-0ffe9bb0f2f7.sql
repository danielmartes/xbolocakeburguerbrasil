CREATE OR REPLACE FUNCTION public.get_order_status(p_external_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_status text;
BEGIN
    SELECT status INTO v_status
    FROM public.orders
    WHERE external_id = p_external_id;

    IF v_status IS NULL THEN
        RETURN 'not_found';
    END IF;

    IF LOWER(v_status) IN ('paid', 'approved', 'completed', 'confirmed', 'succeeded', 'received') THEN
        RETURN 'paid';
    END IF;

    RETURN LOWER(v_status);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_order_status(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_order_status(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_status(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_status(text) TO service_role;

DROP POLICY IF EXISTS "Deny all client access to orders" ON public.orders;
CREATE POLICY "Deny all client access to orders"
ON public.orders
AS PERMISSIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);