import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { trackMetaConversion } from "../_shared/meta-capi.ts";

const QUACPAY_BASE_URL = "https://quacpay.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PixRequest {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  amount: number;
  productName: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone, cpf, amount, productName } = (await req.json()) as PixRequest;
    const cpfDigits = (cpf || "").replace(/\D/g, "");
    const phoneDigits = (phone || "").replace(/\D/g, "");
    // CPF is now optional in the UI, but we'll try to use it if provided
    if (phoneDigits.length < 10) throw new Error("Telefone inválido");
    if (phoneDigits.length < 10) throw new Error("Telefone inválido");

    const clientId = Deno.env.get("QUACPAY_CLIENT_ID") || "qpc_production_bd2758c1f0f8e931";
    const clientSecret = Deno.env.get("QUACPAY_CLIENT_SECRET") || "qps_375fd233742614eecef75327f34962a9de7925bc033c276e";

    if (!clientId || !clientSecret) {
      throw new Error("QuacPay credentials not configured");
    }

    // 1. Get OAuth Token
    console.log("Fetching QuacPay token...");
    const tokenRes = await fetch(`${QUACPAY_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Token error:", errorText);
      throw new Error("Failed to get QuacPay token");
    }

    const { access_token } = await tokenRes.json();

    // 2. Create Customer (Mandatory for /api/v1/customers according to standard REST patterns and QuacPay requirements)
    console.log("Creating QuacPay customer...");
    const customerRes = await fetch(`${QUACPAY_BASE_URL}/api/v1/create-customer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        name,
        email,
        cpfCnpj: cpfDigits || "00000000000", // Fallback if CPF is not provided
        phone: phoneDigits,
        mobilePhone: phoneDigits,
      }),
    });

    if (!customerRes.ok) {
      const customerError = await customerRes.text();
      console.error("Customer creation error:", customerError);
      throw new Error(`Failed to create QuacPay customer: ${customerError}`);
    }

    const customerData = await customerRes.json();
    const customerId = customerData.id || customerData.data?.id || (typeof customerData === 'string' ? customerData : null);

    if (!customerId) {
      console.error("Invalid customer data received:", customerData);
      throw new Error("Customer ID not returned by QuacPay");
    }

    // 3. Create PIX Charge
    console.log("Creating PIX charge...", { customerId, value: amount });
    const pixRes = await fetch(`${QUACPAY_BASE_URL}/api/v1/charges/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        value: Number(amount.toFixed(2)), // Valor em reais
        customerId,
        productName,
        externalReference: `ORD-${Date.now()}`,
      }),
    });

    const pixData = await pixRes.json();

    if (!pixRes.ok || pixData.success === false) {
      console.error("Pix charge error:", pixData);
      throw new Error(
        `${pixData.message || pixData.error || "Failed to create PIX charge"}${pixData.code ? ` (${pixData.code})` : ""}${pixData.request_id ? ` [${pixData.request_id}]` : ""}`
      );
    }

    // Track Lead conversion via CAPI
    try {
      const userAgent = req.headers.get("user-agent") || "";
      const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "";
      
      await trackMetaConversion("Lead", {
        email,
        phone: phoneDigits,
        name,
        userAgent,
        ip
      }, {
        value: amount,
        currency: "BRL",
        content_name: productName
      });
    } catch (e) {
      console.error("Meta CAPI tracking failed:", e);
    }

    // Persist order so the webhook can update its status
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const externalId =
        pixData.chargeId || pixData.id || pixData.charge_id || pixData.transaction_id || pixData.data?.id;
      const pix = pixData.pix || pixData.data?.pix || {};
      await supabase.from("orders").insert({
        external_id: externalId ? String(externalId) : null,
        customer_name: name,
        customer_email: email,
        customer_phone: phoneDigits,
        product_name: productName,
        amount,
        status: "pending",
        payment_method: "pix",
        pix_payload: pixData.qrCodePayload || pix.payload || pix.qrcode || pix.copy_paste || null,
        pix_qrcode: pixData.qrCode || pix.qrcode_image || pix.qr_code || null,
        raw_response: pixData,
      });
    } catch (e) {
      console.error("Failed to persist order:", e);
    }

    return new Response(JSON.stringify(pixData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in pix-create:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
