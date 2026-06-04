import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-quacpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const mapStatus = (raw: string | undefined): string => {
  if (!raw) return "pending";
  const s = raw.toLowerCase();
  if (["paid", "approved", "completed", "confirmed", "succeeded"].includes(s)) return "paid";
  if (["refunded", "chargeback"].includes(s)) return "refunded";
  if (["canceled", "cancelled", "failed", "expired"].includes(s)) return "canceled";
  return "pending";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    console.log("QuacPay webhook received:", JSON.stringify(payload));

    const webhookSecret = Deno.env.get("QUACPAY_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signature =
        req.headers.get("x-quacpay-signature") ||
        req.headers.get("x-webhook-signature");
      if (signature !== webhookSecret) {
        console.warn("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const data = payload.data ?? payload.charge ?? payload;
    const externalId =
      data.id || data.charge_id || data.transaction_id || payload.id;
    const statusRaw = data.status || payload.status || payload.event;

    if (!externalId) {
      console.error("Webhook missing external id");
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = mapStatus(statusRaw);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const update: Record<string, unknown> = {
      status,
      raw_response: payload,
      updated_at: new Date().toISOString(),
    };
    if (status === "paid") update.paid_at = new Date().toISOString();

    const { error } = await supabase
      .from("orders")
      .update(update)
      .eq("external_id", String(externalId));

    if (error) {
      console.error("DB update error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Order ${externalId} updated to status: ${status}`);

    if (status === "paid") {
      const { data: order } = await supabase
        .from("orders")
        .select("customer_email, customer_name")
        .eq("external_id", String(externalId))
        .single();

      if (order?.customer_email) {
        console.log(`Sending deliverable to ${order.customer_email}`);
        await supabase.functions.invoke("gmail-email", {
          body: {
            to: order.customer_email,
            subject: "🍰 Seu acesso: Protocolo Cake Burger",
            customerName: order.customer_name,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">Olá, ${order.customer_name}! 🍰</h2>
                <p style="font-size: 16px; color: #555;">Muito obrigado pela sua compra do <strong>Protocolo Cake Burger</strong>!</p>
                <p style="font-size: 16px; color: #555;">Estamos muito felizes em ter você conosco. Seu acesso ao material já está liberado:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://drive.google.com/drive/folders/1fKH0rQT7r8mc-s7p5F7JSQ4C-SzAcYe4?usp=drive_link" 
                     style="background-color: #ff9900; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 18px;">
                    ACESSAR MATERIAL AGORA
                  </a>
                </div>
                <p style="font-size: 14px; color: #888;">Se tiver qualquer dúvida, basta responder a este e-mail.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #aaa; text-align: center;">Equipe Cake Burger</p>
              </div>
            `,
          },
        });
      }
    }

    return new Response(JSON.stringify({ received: true, status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});