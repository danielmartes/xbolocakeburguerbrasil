import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Home, Copy, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

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

function SuccessPage() {
  const { payment } = Route.useSearch();
  const [pix, setPix] = useState<PixResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pix_result");
      if (raw) setPix(JSON.parse(raw));
    } catch {}
  }, []);

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

  if (payment === "pix" && (qrSrc || pix?.qrCodePayload)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-2xl border border-amber-400/30 bg-zinc-900/70 p-6 sm:p-8 text-center space-y-5">
          <div className="flex items-center justify-center gap-2 text-amber-300">
            <QrCode className="w-6 h-6" />
            <h1 className="text-xl sm:text-2xl font-extrabold">Pague com PIX para liberar o acesso</h1>
          </div>
          {pix?.amount != null && (
            <p className="text-zinc-300 text-sm">
              Valor: <span className="font-bold text-white">R$ {Number(pix.amount).toFixed(2).replace(".", ",")}</span>
            </p>
          )}
          {qrSrc && (
            <div className="bg-white rounded-xl p-3 inline-block mx-auto">
              <img src={qrSrc} alt="QR Code PIX" className="w-64 h-64 object-contain" />
            </div>
          )}
          {pix?.qrCodePayload && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">Ou copie o código PIX:</p>
              <div className="bg-black/40 border border-zinc-700 rounded-lg p-3 text-[11px] break-all text-zinc-200 font-mono">
                {pix.qrCodePayload}
              </div>
              <button
                onClick={copyPayload}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-3 rounded-xl"
              >
                <Copy className="w-4 h-4" /> Copiar código PIX
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-400">
            Assim que o pagamento for confirmado, você receberá o acesso por e-mail e WhatsApp.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm">
            <Home className="w-4 h-4" /> Voltar ao início
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
            ? "Seu PIX foi gerado. Em instantes você receberá os dados de acesso no seu e-mail."
            : "Seu pagamento no cartão está sendo processado. Você receberá os dados de acesso por e-mail."}
        </p>
        <Link to="/" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-5 py-3 rounded-xl">
          <Home className="w-4 h-4" /> Voltar ao início
        </Link>
      </div>
    </div>
  );
}