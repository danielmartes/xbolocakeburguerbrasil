import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getBodyHtml = createServerFn({ method: "GET" }).handler(async () => {
  const url = new URL("../../public/cloned/body.html", import.meta.url);
  const { readFile } = await import("node:fs/promises");
  try {
    return await readFile(url, "utf-8");
  } catch {
    const res = await fetch("/cloned/body.html");
    return await res.text();
  }
});

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
        // @ts-expect-error fetchpriority is valid HTML
        fetchpriority: "high",
      },
    ],
  }),
  loader: () => getBodyHtml(),
  component: Index,
});

function Index() {
  const html = Route.useLoaderData();
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}