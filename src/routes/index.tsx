import { createFileRoute } from "@tanstack/react-router";
import bodyHtml from "../../public/cloned/body.html?raw";

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
  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}