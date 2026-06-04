import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Home } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/sucesso")({
  validateSearch: z.object({ payment: z.enum(["pix", "card"]).optional() }),
  head: () => ({ meta: [{ title: "Pedido Confirmado" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { payment } = Route.useSearch();
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