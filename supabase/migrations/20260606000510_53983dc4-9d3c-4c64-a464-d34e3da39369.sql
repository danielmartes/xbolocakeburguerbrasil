CREATE OR REPLACE FUNCTION public.get_order_status(p_external_id text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
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

    -- Map various success statuses to 'paid'
    IF LOWER(v_status) IN ('paid', 'approved', 'completed', 'confirmed', 'succeeded', 'received') THEN
        RETURN 'paid';
    END IF;

    RETURN LOWER(v_status);
END;
$function$;