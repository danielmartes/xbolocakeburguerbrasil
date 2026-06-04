import { createServerFn } from "@tanstack/start";

const CAKTO_BASE_URL = "https://api.cakto.com.br/public_api";

export const getCaktoCheckoutUrl = createServerFn({ method: "GET" })
  .validator((offerId: string) => offerId)
  .handler(async ({ data: offerId }) => {
    const clientId = process.env.CAKTO_CLIENT_ID;
    const clientSecret = process.env.CAKTO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Cakto credentials missing");
      throw new Error("Configuração de pagamento incompleta");
    }

    try {
      // 1. Obter Token
      const tokenResponse = await fetch(`${CAKTO_BASE_URL}/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Falha na autenticação com Cakto");
      }

      const { access_token } = await tokenResponse.json();

      // 2. Buscar Oferta para pegar a URL de checkout
      // Nota: A API de listagem de ofertas pode ser usada para encontrar a URL
      // Se tivermos o ID da oferta, podemos tentar obter os detalhes dela
      const offerResponse = await fetch(`${CAKTO_BASE_URL}/offers/${offerId}/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!offerResponse.ok) {
        throw new Error("Oferta não encontrada na Cakto");
      }

      const offerData = await offerResponse.json();
      
      // A URL de checkout costuma seguir um padrão se não estiver no objeto
      // Mas vamos procurar por ela nos dados retornados
      return offerData.checkout_url || `https://pay.cakto.com.br/${offerId}`;
    } catch (error) {
      console.error("Error in getCaktoCheckoutUrl:", error);
      throw error;
    }
  });
