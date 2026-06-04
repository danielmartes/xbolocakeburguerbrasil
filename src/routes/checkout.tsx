import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ShoppingBag, ChevronDown, ChevronUp, Loader2, QrCode, ShieldCheck, Sparkles, Clock, Video, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Checkout Seguro — Protocolo Cake Burger" },
      { name: "description", content: "Finalize sua compra do Protocolo Cake Burger com segurança via PIX." },
    ],
    links: [{ rel: "stylesheet", href: "/cloned/styles.css" }],
  }),
  component: CheckoutPage,
});

const PRICE = 15.9;
const PIX_DISCOUNT = 0.10;

type Buyer = { name: string; email: string; phone: string };

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a.length === 2 ? ") " : "", b, c && `-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};

function CheckoutPage() {
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<Buyer>({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    try {
      const b = localStorage.getItem("checkout_buyer");
      if (b) setBuyer(JSON.parse(b));
    } catch {}
  }, []);

  const total = PRICE * (1 - PIX_DISCOUNT);

  const validate = () => {
    const e: Record<string, string> = {};
    if (buyer.name.trim().length < 3) e.name = "Informe seu nome completo";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) e.email = "E-mail inválido";
    if (buyer.phone.replace(/\D/g, "").length < 10) e.phone = "Telefone inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Verifique os campos destacados.");
      return;
    }
    setLoading(true);
    localStorage.setItem("checkout_buyer", JSON.stringify(buyer));
    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: buyer.name, email: buyer.email, phone: buyer.phone,
          amount: total, productName: "Protocolo Cake Burger",
        }),
      }).catch(() => null);
      const data = res && res.ok ? await res.json().catch(() => null) : null;
      sessionStorage.setItem("pix_result", JSON.stringify(data ?? { amount: total }));
      navigate({ to: "/sucesso", search: { payment: "pix" } as any });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-white border-2 border-border focus-visible:ring-primary focus-visible:border-primary";
  const errCls = (k: string) => errors[k] ? "border-destructive" : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top banner — matches site header */}
      <header className="bg-gradient-cta sticky top-0 z-40 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
        <Sparkles className="mr-1 inline h-3 w-3" />
        Checkout 100% Seguro e Criptografado
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-6">
          <Badge icon={<Clock className="h-3.5 w-3.5 text-primary" />}>Acesso imediato</Badge>
          <Badge icon={<Video className="h-3.5 w-3.5 text-primary" />}>Aula em Vídeo</Badge>
          <Badge icon={<Smartphone className="h-3.5 w-3.5 text-primary" />}>100% online</Badge>
        </div>

        {/* Mobile collapsible summary */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setSummaryOpen((s) => !s)}
            className="w-full bg-card border-2 border-border shadow-card rounded-2xl p-4 flex items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="w-4 h-4 text-primary" /> Resumo do pedido
            </span>
            <span className="flex items-center gap-2">
              <span className="text-gradient-primary text-lg font-extrabold">R$ {total.toFixed(2).replace(".", ",")}</span>
              {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>
          {summaryOpen && <div className="mt-3"><Summary total={total} /></div>}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <Card title="Seus dados">
              <Field label="Nome Completo" error={errors.name}>
                <Input className={`${inputCls} ${errCls("name")}`} value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} placeholder="Seu nome completo" />
              </Field>
              <Field label="E-mail" error={errors.email}>
                <Input type="email" className={`${inputCls} ${errCls("email")}`} value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} placeholder="voce@email.com" />
              </Field>
              <Field label="Telefone (WhatsApp)" error={errors.phone}>
                <Input className={`${inputCls} ${errCls("phone")}`} value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" />
              </Field>
              <p className="text-xs text-muted-foreground">📩 O acesso será enviado ao seu e-mail e WhatsApp logo após o pagamento.</p>
            </Card>

            <Card title="Forma de pagamento">
              <div className="relative rounded-2xl border-2 border-primary bg-primary/5 p-5 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <QrCode className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-base">PIX</p>
                  <p className="text-xs text-muted-foreground">Aprovação imediata após o pagamento</p>
                </div>
                <span className="absolute -top-2.5 -right-2 bg-gradient-cta text-primary-foreground text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-cta uppercase tracking-wider">10% OFF</span>
              </div>
              <div className="mt-4 rounded-xl bg-accent/10 border border-accent/30 p-4 text-sm leading-relaxed">
                Pague com PIX e ganhe <b className="text-primary">10% de desconto</b>. Total: <b className="text-primary">R$ {total.toFixed(2).replace(".", ",")}</b>. O QR Code será gerado após confirmar o pedido.
              </div>
            </Card>
          </div>

          <aside className="lg:col-span-5 hidden lg:block">
            <div className="sticky top-20">
              <Summary total={total} />
              <button
                type="submit"
                disabled={loading}
                className="cta-offer-button mt-4 w-full bg-gradient-cta hover:opacity-95 disabled:opacity-70 text-primary-foreground font-extrabold py-4 rounded-full flex items-center justify-center gap-2 transition shadow-cta text-base uppercase tracking-wider"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : <><ShieldCheck className="w-5 h-5" /> Quero acessar agora</>}
              </button>
              <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" /> Pagamento processado com segurança
              </p>
            </div>
          </aside>

          <div className="lg:hidden">
            <button
              type="submit"
              disabled={loading}
              className="cta-offer-button w-full bg-gradient-cta hover:opacity-95 disabled:opacity-70 text-primary-foreground font-extrabold py-4 rounded-full flex items-center justify-center gap-2 transition shadow-cta text-base uppercase tracking-wider"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : <><ShieldCheck className="w-5 h-5" /> Quero acessar agora</>}
            </button>
            <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" /> Pagamento processado com segurança
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card/90 border border-border/60 shadow-card flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur">
      {icon}{children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card shadow-card p-5 sm:p-6 space-y-4">
      <h2 className="font-display text-xl font-extrabold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-foreground text-sm font-semibold">{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
    </div>
  );
}

function Summary({ total }: { total: number }) {
  const discount = PRICE * PIX_DISCOUNT;
  return (
    <div className="rounded-2xl border-2 border-border bg-card shadow-soft p-5 space-y-4">
      <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-primary" /> Resumo do pedido
      </h3>
      <div className="flex gap-3 items-center">
        <img src="/cloned/a41ee0a536b6.webp" alt="Protocolo Cake Burger" className="w-16 h-16 rounded-xl object-cover border-2 border-border" />
        <div className="flex-1">
          <p className="font-bold text-sm">Protocolo Cake Burger</p>
          <p className="text-muted-foreground text-xs">Acesso vitalício • Quantidade: 1</p>
        </div>
        <span className="font-bold text-sm">R$ {PRICE.toFixed(2).replace(".", ",")}</span>
      </div>
      <div className="border-t border-border pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R$ {PRICE.toFixed(2).replace(".", ",")}</span></div>
        <div className="flex justify-between text-primary font-semibold"><span>Desconto PIX (10%)</span><span>- R$ {discount.toFixed(2).replace(".", ",")}</span></div>
      </div>
      <div className="border-t border-border pt-3 flex items-center justify-between">
        <span className="font-bold">Total</span>
        <span className="text-3xl font-extrabold text-gradient-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
      </div>
    </div>
  );
}