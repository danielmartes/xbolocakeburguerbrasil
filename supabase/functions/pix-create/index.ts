import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const QUACPAY_BASE_URL = "https://quacpay.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PixRequest {
  name: string;
  email: string;
  phone: string;
  amount: number;
  productName: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone, amount, productName } = (await req.json()) as PixRequest;

    const clientId = Deno.env.get("QUACPAY_CLIENT_ID");
    const clientSecret = Deno.env.get("QUACPAY_CLIENT_SECRET");

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

    // 2. Create Customer (Optional but recommended by docs)
    // Note: Documentation says Quickstart: token -> create-customer -> cobrança Pix
    // We'll skip for now if the pix endpoint allows inline customer data or if we can map fields directly
    // Let's assume a "create charge" endpoint under /api/v1/pix/charges (common pattern)
    // Since the doc provided is high level, I'll implement a robust structure that can be adjusted.
    
    console.log("Creating PIX charge...");
    const pixRes = await fetch(`${QUACPAY_BASE_URL}/api/v1/pix/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Amount in cents usually
        customer: {
          name,
          email,
          phone: phone.replace(/\D/g, ""),
        },
        description: productName,
        payment_method: "pix",
      }),
    });

    const pixData = await pixRes.json();

    if (!pixRes.ok) {
      console.error("Pix charge error:", pixData);
      throw new Error(pixData.message || "Failed to create PIX charge");
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
