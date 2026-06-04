import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Home, Copy, QrCode, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sucesso")({
  validateSearch: z.object({ payment: z.enum(["pix", "card"]).optional() }),
  head: () => ({ meta: [{ title: "Pedido Confirmado" }] }),
  ssr: false,
  component: SuccessPage,
});

type PixResult = {
  qrCode?: string;
  qrCodePayload?: string;
  paymentLink?: string;
  chargeId?: string;
  amount?: number;
};

const DRIVE_LINK = "https://drive.google.com/drive/folders/1fKH0rQT7r8mc-s7p5F7JSQ4C-SzAcYe4?usp=drive_link";

function SuccessPage() {
  const { payment } = Route.useSearch();
  const [pix, setPix] = useState<PixResult | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pix_result");
      if (raw) {
        const data = JSON.parse(raw);
        setPix(data);
        if (data.chargeId) {
          checkStatus(data.chargeId);
        }
      }
    } catch {}
  }, []);

  // Polling for payment status
  useEffect(() => {
    if (status === "paid" || !pix?.chargeId) return;

    const interval = setInterval(() => {
      checkStatus(pix.chargeId!);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [pix?.chargeId, status]);

  const checkStatus = async (chargeId: string) => {
    try {
      setChecking(true);
      const { data } = await supabase.rpc("get_order_status", {
        p_external_id: chargeId,
      });

      if (data === "paid") {
        setStatus("paid");
        toast.success("Pagamento confirmado! Seu acesso foi liberado.");
      }
    } catch (err) {
      console.error("Error checking status:", err);
    } finally {
      setChecking(false);
    }
  };

  const qrSrc = pix?.qrCode
    ? pix.qrCode.startsWith("data:")
      ? pix.qrCode
      : `data:image/png;base64,${pix.qrCode}`
    : null;

  const copyPayload = async () => {
    if (!pix?.qrCodePayload) return;
    try {
      await navigator.clipboard.writeText(pix.qrCodePayload);
      toast.success("Código PIX copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  if (status === "paid") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-2xl border border-emerald-500/30 bg-zinc-900/60 p-8 text-center space-y-6">
          <div className="relative inline-block">
            <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-25 animate-pulse"></div>
            <CheckCircle2 className="w-20 h-20 text-emerald-400 relative" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">Pagamento Confirmado!</h1>
            <p className="text-zinc-300">
              Seu acesso ao <span className="text-white font-bold">Protocolo Cake Burger</span> já está liberado. Clique no botão abaixo para acessar o conteúdo no Google Drive.
            </p>
          </div>
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-200">
            Você também recebeu os dados de acesso no seu e-mail e WhatsApp.
          </div>

          <a
            href={DRIVE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-lg px-8 py-5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ExternalLink className="w-6 h-6" /> ACESSAR PRODUTO AGORA
          </a>

          <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors">
            <Home className="w-4 h-4" /> Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  if (payment === "pix" && (qrSrc || pix?.qrCodePayload)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-2xl border border-amber-400/30 bg-zinc-900/70 p-6 sm:p-8 text-center space-y-5">
          <div className="flex items-center justify-center gap-2 text-amber-300">
            <QrCode className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-extrabold">Pague com PIX para liberar o acesso</h1>
          </div>
          
          <div className="flex items-center justify-center gap-2 py-1 px-3 bg-amber-400/10 rounded-full w-fit mx-auto border border-amber-400/20">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Aguardando Pagamento</span>
          </div>

          {pix?.amount != null && (
            <p className="text-zinc-300 text-sm">
              Valor: <span className="font-bold text-white">R$ {Number(pix.amount).toFixed(2).replace(".", ",")}</span>
            </p>
          )}
          {qrSrc && (
            <div className="bg-white rounded-xl p-3 inline-block mx-auto shadow-xl">
              <img src={qrSrc} alt="QR Code PIX" className="w-64 h-64 object-contain" />
            </div>
          )}
          {pix?.qrCodePayload && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">Ou copie o código PIX:</p>
              <div className="bg-black/40 border border-zinc-700 rounded-lg p-3 text-[11px] break-all text-zinc-200 font-mono">
                {pix.qrCodePayload}
              </div>
              <button
                onClick={copyPayload}
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-4 rounded-xl transition-all"
              >
                <Copy className="w-4 h-4" /> Copiar código PIX
              </button>
            </div>
          )}
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Verificando pagamento em tempo real...</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-[280px]">
              Assim que o pagamento for detectado, esta página será atualizada automaticamente com seu acesso.
            </p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white text-xs transition-colors pt-2">
            <Home className="w-4 h-4" /> Cancelar e voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-2xl border border-emerald-500/30 bg-zinc-900/60 p-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
        <h1 className="text-2xl font-bold">Pedido Confirmado!</h1>
        <p className="text-zinc-300">
          {payment === "pix"
            ? "Seu PIX foi gerado. Assim que o pagamento for confirmado, você poderá acessar o produto aqui mesmo ou através do seu e-mail."
            : "Seu pagamento no cartão está sendo processado. Você receberá os dados de acesso por e-mail."}
        </p>
        <Link to="/" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-3 rounded-xl transition-all">
          <Home className="w-4 h-4" /> Voltar ao início
        </Link>
      </div>
    </div>
  );
}