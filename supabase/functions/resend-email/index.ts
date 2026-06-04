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
    console.log(`[resend-email] Enviando via Resend para: ${to}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não configurada nas variáveis de ambiente.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Cake Burger <onboarding@resend.dev>", // Note: Replace with your verified domain for production
        to,
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[resend-email] Erro no Resend:", result);
      throw new Error(`Erro ao enviar e-mail via Resend: ${JSON.stringify(result)}`);
    }

    console.log("[resend-email] E-mail enviado com sucesso via Resend:", result);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "E-mail enviado com sucesso via Resend",
      recipient: to,
      result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in resend-email:", error.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});



