CREATE POLICY "Permitir leitura de status do pedido por external_id" ON public.orders FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.orders TO anon, authenticated;