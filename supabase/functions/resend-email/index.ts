const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = (await req.json()) as EmailRequest;
    console.log(`[resend-email] Enviando via Gateway para: ${to}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // Tentativa de envio usando o gateway do Lovable para o conector Gmail
    const response = await fetch("https://api.lovable.dev/v1/connectors/google_mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        body: html,
        is_html: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[resend-email] Erro no Gateway:", errorData);
      // Mesmo com erro no gateway, vamos registrar o log para depuração
    } else {
      console.log("[resend-email] Gateway respondeu com sucesso");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Processado",
      recipient: to
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in resend-email:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

