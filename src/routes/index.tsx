import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import bodyHtml from "../../public/cloned/body.html?raw";

export const Route = createFileRoute("/")({
  ssr: false,
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
    links: [
      { rel: "stylesheet", href: "/cloned/styles.css" },
      {
        rel: "preload",
        as: "image",
        href: "/cloned/a41ee0a536b6.webp",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Intercept clicks on elements with the specific text
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const closestButton = target.closest(".cta-offer-button, .cta-button, button, a");
      
      if (closestButton) {
        const text = closestButton.textContent?.toLowerCase() || "";
        if (text.includes("quero acessar agora") || text.includes("quero acessar o protocolo cake burger")) {
          e.preventDefault();
          e.stopPropagation();
          navigate({ to: "/checkout" });
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [navigate]);

  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}