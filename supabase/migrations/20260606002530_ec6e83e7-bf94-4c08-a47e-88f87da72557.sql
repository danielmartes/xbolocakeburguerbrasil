CREATE OR REPLACE FUNCTION public.get_order_status(p_external_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status text;
BEGIN
    -- Busca o status atual do pedido pelo ID externo (QuacPay payment_id)
    SELECT status INTO v_status
    FROM public.orders
    WHERE external_id = p_external_id;

    -- Se não encontrar o pedido, retorna not_found
    IF v_status IS NULL THEN
        RETURN 'not_found';
    END IF;

    -- Mapeia os diversos status de sucesso para 'paid' para o frontend
    -- Adicionando 'received' que é o status específico da QuacPay
    IF LOWER(v_status) IN ('paid', 'approved', 'completed', 'confirmed', 'succeeded', 'received') THEN
        RETURN 'paid';
    END IF;

    -- Caso contrário, retorna o status em minúsculo
    RETURN LOWER(v_status);
END;
$$;

-- Garante permissões corretas
REVOKE EXECUTE ON FUNCTION public.get_order_status(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_order_status(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_status(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_status(text) TO service_role;