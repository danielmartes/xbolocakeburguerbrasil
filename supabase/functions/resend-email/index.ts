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
    console.log(`[resend-email] Enviando via Gmail para: ${to}`);

    const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    
    if (!GMAIL_API_KEY) {
      throw new Error("GOOGLE_MAIL_API_KEY não configurada nas variáveis de ambiente.");
    }

    // Chamada direta para a API do conector Gmail via Lovable Gateway
    const response = await fetch("https://api.lovable.dev/v1/connectors/google_mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        body: html,
        is_html: true
      }),
    });





    const resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { message: resultText };
    }

    if (!response.ok) {
      console.error("[resend-email] Erro no Gateway:", result);
      throw new Error(`Erro ao enviar e-mail: ${JSON.stringify(result)}`);
    }

    console.log("[resend-email] E-mail enviado com sucesso:", result);


    return new Response(JSON.stringify({ 
      success: true, 
      message: "E-mail enviado com sucesso",
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


