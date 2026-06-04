import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ShoppingBag, ChevronDown, ChevronUp, Loader2, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout Seguro — Protocolo Cake Burger" },
      { name: "description", content: "Finalize sua compra do Protocolo Cake Burger com segurança." },
    ],
    links: [{ rel: "stylesheet", href: "/cloned/styles.css" }],
  }),
  component: CheckoutPage,
});

const PRICE = 15.9;
const PIX_DISCOUNT = 0.10;

type Buyer = { name: string; email: string; phone: string };
type Address = { street: string; number: string; complement: string; neighborhood: string; city: string; state: string };
type Card = { number: string; name: string; expiry: string; cvv: string };

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a.length === 2 ? ") " : "", b, c && `-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};
const maskCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const maskExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

function CheckoutPage() {
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState<Buyer>({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState<Address>({ street: "", number: "", complement: "", neighborhood: "", city: "", state: "" });
  const [payment, setPayment] = useState<"pix" | "card">("pix");
  const [card, setCard] = useState<Card>({ number: "", name: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    try {
      const b = localStorage.getItem("checkout_buyer");
      const a = localStorage.getItem("checkout_address");
      if (b) setBuyer(JSON.parse(b));
      if (a) setAddress(JSON.parse(a));
    } catch {}
  }, []);

  const total = payment === "pix" ? PRICE * (1 - PIX_DISCOUNT) : PRICE;

  const validate = () => {
    const e: Record<string, string> = {};
    if (buyer.name.trim().length < 3) e.name = "Informe seu nome completo";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) e.email = "E-mail inválido";
    if (buyer.phone.replace(/\D/g, "").length < 10) e.phone = "Telefone inválido";
    if (address.street.trim().length < 2) e.street = "Informe a rua";
    if (!address.number.trim()) e.number = "Informe o número";
    if (address.neighborhood.trim().length < 2) e.neighborhood = "Informe o bairro";
    if (address.city.trim().length < 2) e.city = "Informe a cidade";
    if (address.state.trim().length < 2) e.state = "UF";
    if (payment === "card") {
      if (card.number.replace(/\D/g, "").length < 13) e.cardNumber = "Número inválido";
      if (card.name.trim().length < 3) e.cardName = "Nome inválido";
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.cardExpiry = "MM/AA";
      if (card.cvv.length < 3) e.cardCvv = "CVV";
    }
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
    localStorage.setItem("checkout_address", JSON.stringify(address));
    try {
      if (payment === "pix") {
        const res = await fetch("/api/pix/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: buyer.name, email: buyer.email, phone: buyer.phone,
            address: { ...address }, amount: total, productName: "Protocolo Cake Burger",
          }),
        }).catch(() => null);
        const data = res && res.ok ? await res.json().catch(() => null) : null;
        sessionStorage.setItem("pix_result", JSON.stringify(data ?? { amount: total }));
        navigate({ to: "/sucesso", search: { payment: "pix" } as any });
      } else {
        const digits = card.number.replace(/\D/g, "");
        sessionStorage.setItem("card_payment", JSON.stringify({
          number: digits, name: card.name, expiry: card.expiry, last4: digits.slice(-4), amount: total,
        }));
        navigate({ to: "/sucesso", search: { payment: "card" } as any });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-zinc-900/40 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500 focus-visible:border-amber-500/50";
  const errCls = (k: string) => errors[k] ? "border-red-500" : "";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-amber-500/30">
      {/* Header Segura */}
      <div className="bg-emerald-500/5 border-b border-emerald-500/10">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-emerald-500/80 text-[10px] sm:text-xs font-medium tracking-wide uppercase">
          <Lock className="w-3 h-3" /> Ambiente 100% Seguro e Criptografado
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 sm:gap-8 mb-8">
          {["Dados", "Endereço", "Pagamento"].map((label, i) => (
            <div key={label} className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-[10px] shadow-lg shadow-amber-500/20">{i + 1}</div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 transition-colors">{label}</span>
              {i < 2 && <div className="w-4 sm:w-10 h-px bg-zinc-800" />}
            </div>
          ))}
        </div>

        {/* Mobile collapsible summary */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setSummaryOpen((s) => !s)}
            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900/60 transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400"><ShoppingBag className="w-4 h-4 text-amber-500" /> Resumo do pedido</span>
            <span className="flex items-center gap-2">
              <span className="text-amber-500 font-bold">R$ {total.toFixed(2).replace(".", ",")}</span>
              {summaryOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </span>
          </button>
          {summaryOpen && <div className="mt-2"><Summary total={total} payment={payment} /></div>}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            {/* Card 1 */}
            <Card title="Dados do comprador">
              <Field label="Nome Completo" error={errors.name}>
                <Input className={`${inputCls} ${errCls("name")}`} value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} placeholder="Seu nome" />
              </Field>
              <Field label="E-mail" error={errors.email}>
                <Input type="email" className={`${inputCls} ${errCls("email")}`} value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} placeholder="voce@email.com" />
              </Field>
              <Field label="Telefone" error={errors.phone}>
                <Input className={`${inputCls} ${errCls("phone")}`} value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" />
              </Field>
            </Card>

            {/* Card 2 */}
            <Card title="Endereço de entrega">
              <Field label="Rua" error={errors.street}>
                <Input className={`${inputCls} ${errCls("street")}`} value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Número" error={errors.number}>
                  <Input className={`${inputCls} ${errCls("number")}`} value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
                </Field>
                <Field label="Complemento">
                  <Input className={inputCls} value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} />
                </Field>
              </div>
              <Field label="Bairro" error={errors.neighborhood}>
                <Input className={`${inputCls} ${errCls("neighborhood")}`} value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} />
              </Field>
              <div className="grid grid-cols-[1fr_100px] gap-3">
                <Field label="Cidade" error={errors.city}>
                  <Input className={`${inputCls} ${errCls("city")}`} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                </Field>
                <Field label="Estado" error={errors.state}>
                  <Input maxLength={2} className={`${inputCls} ${errCls("state")} uppercase`} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} />
                </Field>
              </div>
            </Card>

            {/* Card 3 */}
            <Card title="Forma de pagamento">
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "pix" | "card")} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`relative cursor-pointer rounded-xl border p-4 flex items-center gap-3 transition-all duration-300 ${payment === "pix" ? "border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-700"}`}>
                  <RadioGroupItem value="pix" className="border-zinc-700 text-amber-500" />
                  <QrCode className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-sm tracking-tight">PIX</span>
                  <span className="absolute -top-2.5 -right-2 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/20 uppercase tracking-tighter">10% OFF</span>
                </label>
                <label className={`cursor-pointer rounded-xl border p-4 flex items-center gap-3 transition-all duration-300 ${payment === "card" ? "border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-700"}`}>
                  <RadioGroupItem value="card" className="border-zinc-700 text-amber-500" />
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-sm tracking-tight">Cartão de Crédito</span>
                </label>
              </RadioGroup>

              {payment === "pix" && (
                <div className="mt-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4 text-[11px] leading-relaxed text-emerald-500/80">
                  Pague com PIX e ganhe <b className="text-emerald-400">10% de desconto</b>. Total: <b className="text-emerald-400">R$ {total.toFixed(2).replace(".", ",")}</b>. O QR Code será gerado após confirmar o pedido.
                </div>
              )}

              {payment === "card" && (
                <div className="mt-4 space-y-3">
                  <Field label="Número do Cartão" error={errors.cardNumber}>
                    <Input className={`${inputCls} ${errCls("cardNumber")}`} value={card.number} onChange={(e) => setCard({ ...card, number: maskCard(e.target.value) })} placeholder="0000 0000 0000 0000" />
                  </Field>
                  <Field label="Nome no Cartão" error={errors.cardName}>
                    <Input className={`${inputCls} ${errCls("cardName")}`} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Validade (MM/AA)" error={errors.cardExpiry}>
                      <Input className={`${inputCls} ${errCls("cardExpiry")}`} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: maskExpiry(e.target.value) })} placeholder="MM/AA" />
                    </Field>
                    <Field label="CVV" error={errors.cardCvv}>
                      <Input maxLength={4} className={`${inputCls} ${errCls("cardCvv")}`} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" />
                    </Field>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <aside className="lg:col-span-5 hidden lg:block">
            <div className="sticky top-4">
              <Summary total={total} payment={payment} />
              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-70 text-black font-black text-sm uppercase tracking-widest py-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-amber-500/20 active:scale-[0.98]"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : <><ShieldCheck className="w-5 h-5" /> Finalizar Pedido</>}
              </button>
              <p className="text-center text-[10px] uppercase tracking-widest font-bold text-zinc-600 mt-4 flex items-center justify-center gap-2 italic">
                <Lock className="w-3 h-3 text-emerald-500/50" /> Pagamento 100% Seguro
              </p>
            </div>
          </aside>

          <div className="lg:hidden">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-70 text-black font-black text-sm uppercase tracking-widest py-5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-amber-500/20 active:scale-[0.98]"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</> : <><ShieldCheck className="w-5 h-5" /> Finalizar Pedido</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur p-5 sm:p-6 space-y-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-zinc-300 text-sm">{label}</Label>
      {children}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

function Summary({ total, payment }: { total: number; payment: "pix" | "card" }) {
  const discount = PRICE * PIX_DISCOUNT;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <h3 className="font-bold text-white flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-amber-400" /> Resumo do pedido</h3>
      <div className="flex gap-3 items-center">
        <img src="/cloned/a41ee0a536b6.webp" alt="Protocolo Cake Burger" className="w-16 h-16 rounded-lg object-cover border border-zinc-700" />
        <div className="flex-1">
          <p className="font-semibold text-white text-sm">Protocolo Cake Burger</p>
          <p className="text-zinc-400 text-xs">Quantidade: 1</p>
        </div>
        <span className="text-white font-semibold text-sm">R$ {PRICE.toFixed(2).replace(".", ",")}</span>
      </div>
      <div className="border-t border-zinc-800 pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-zinc-300"><span>Subtotal</span><span>R$ {PRICE.toFixed(2).replace(".", ",")}</span></div>
        <div className="flex justify-between text-emerald-400"><span>Frete</span><span>Grátis</span></div>
        {payment === "pix" && (
          <div className="flex justify-between text-emerald-400"><span>Desconto PIX (10%)</span><span>- R$ {discount.toFixed(2).replace(".", ",")}</span></div>
        )}
      </div>
      <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
        <span className="text-white font-semibold">Total</span>
        <span className="text-2xl font-extrabold text-amber-400">R$ {total.toFixed(2).replace(".", ",")}</span>
      </div>
    </div>
  );
}