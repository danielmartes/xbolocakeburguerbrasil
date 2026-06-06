import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import bodyHtml from "../../public/cloned/body.html?raw";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Protocolo Cake Burger — Mude sua Realidade Financeira" },
      {
        name: "description",
        content:
          "Aprenda o método completo do Cake Burger com as melhores confeiteiras do Brasil e conquiste clientes desde o primeiro olhar.",
      },
      { property: "og:title", content: "Protocolo Cake Burger" },
      {
        property: "og:description",
        content:
          "Descubra como criar um produto que chama atenção e muda sua realidade financeira.",
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
    // inject click-animation styles once
    const styleId = "cta-click-anim";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        @keyframes cta-pop {
          0% { transform: scale(1); }
          40% { transform: scale(0.92); }
          70% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        .cta-click-anim {
          animation: cta-pop 0.35s ease-out forwards !important;
        }
      `;
      document.head.appendChild(s);
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const closestButton = target.closest(".cta-offer-button, .cta-button, button, a");

      if (closestButton) {
        const text = closestButton.textContent?.toLowerCase() || "";
        if (text.includes("quero acessar agora") || text.includes("quero acessar o protocolo cake burger")) {
          e.preventDefault();
          e.stopPropagation();
          const el = closestButton as HTMLElement;
          el.classList.remove("cta-click-anim");
          void el.offsetWidth; // force reflow
          el.classList.add("cta-click-anim");
          setTimeout(() => {
            navigate({ to: "/checkout" });
          }, 300);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [navigate]);

  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}