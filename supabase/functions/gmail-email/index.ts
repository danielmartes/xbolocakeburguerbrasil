import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  customerName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, customerName } = (await req.json()) as EmailRequest;
    console.log(`[gmail-email] Enviando via Gmail para: ${to}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY_1");

    if (!LOVABLE_API_KEY || !GOOGLE_MAIL_API_KEY) {
      throw new Error("Credenciais do Gmail (LOVABLE_API_KEY ou GOOGLE_MAIL_API_KEY_1) não configuradas.");
    }

    // Se o HTML for genérico ou estiver vazio, usamos um template mais bonitinho
    const finalHtml = html || `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Olá${customerName ? `, ${customerName}` : ''}! 🍰</h2>
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
    `;

    // Construct RFC 2822 message
    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=utf-8`,
      `MIME-Version: 1.0`,
      "",
      finalHtml,
    ].join("\r\n");

    const encoder = new TextEncoder();
    const data = encoder.encode(emailContent);
    const binary = String.fromCharCode(...data);
    const base64url = btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
      },
      body: JSON.stringify({
        raw: base64url,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[gmail-email] Erro no Gateway Lovable:", result);
      throw new Error(`Erro ao enviar e-mail via Gmail: ${JSON.stringify(result)}`);
    }

    console.log("[gmail-email] E-mail enviado com sucesso via Gmail:", result);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "E-mail enviado com sucesso via Gmail",
      result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in gmail-email:", error.message);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

