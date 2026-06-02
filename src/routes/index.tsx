import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Protocolo Cake Burger — O doce que vira febre" },
      {
        name: "description",
        content:
          "Crie Cake Burgers irresistíveis e transforme curiosidade em pedidos pelo Instagram e WhatsApp.",
      },
      { property: "og:title", content: "Protocolo Cake Burger" },
      {
        property: "og:description",
        content:
          "O doce que faz clientes perguntarem como comprar antes mesmo de saber o preço.",
      },
    ],
    links: [{ rel: "stylesheet", href: "/cloned/styles.css" }],
  }),
  component: Index,
});

function Index() {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    fetch("/cloned/body.html")
      .then((r) => r.text())
      .then(setHtml);
  }, []);

  if (!html) {
    return <div className="min-h-screen bg-background" />;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
