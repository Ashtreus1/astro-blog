import { c as createComponent, f as createAstro, g as addAttribute, h as renderHead, e as renderComponent, r as renderTemplate } from '../../chunks/astro/server_DUQ9axT8.mjs';
import 'kleur/colors';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { M as MessageBox } from '../../chunks/MessageBox_phxlR_oy.mjs';
import { s as supabase } from '../../chunks/supabaseClient_u6czMeHD.mjs';
/* empty css                                    */
export { renderers } from '../../renderers.mjs';

function CustomerChat({ ticket }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    supabase.from("messages").select("*").eq("ticket_id", ticket.id).order("created_at", { ascending: true }).then(({ data }) => data && setMessages(data));
    const chan = supabase.channel(`messages-${ticket.id}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `ticket_id=eq.${ticket.id}` },
      (p) => setMessages((m) => [...m, p.new])
    ).subscribe();
    return () => chan.unsubscribe();
  }, [ticket.id]);
  const appendMessage = (m) => setMessages((prev) => [...prev, m]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-b p-4 bg-blue-50", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: ticket.name }),
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: `${ticket.issue} – ${ticket.status}` })
    ] }),
    /* @__PURE__ */ jsx(MessageBox, { ticketId: ticket.id, messages, appendMessage, senderType: "customer" })
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const $$ticketId = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ticketId;
  const { ticketId } = Astro2.params;
  const { data: ticket, error } = await supabase.from("tickets").select("*").eq("id", ticketId).single();
  if (error || !ticket) {
    return new Response("Ticket not found", { status: 404 });
  }
  return renderTemplate`<html lang="en"> <head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="viewport" content="width=device-width"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>Customer Chat</title>${renderHead()}</head> <body class="h-screen m-0"> <main class="h-full"> ${renderComponent($$result, "CustomerChat", CustomerChat, { "client:load": true, "ticket": ticket, "client:component-hydration": "load", "client:component-path": "@/react-components/CustomerChat", "client:component-export": "default" })} </main> </body></html>`;
}, "/home/keiru/Documents/chatdesk/src/pages/chats/[ticketId].astro", void 0);

const $$file = "/home/keiru/Documents/chatdesk/src/pages/chats/[ticketId].astro";
const $$url = "/chats/[ticketId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ticketId,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
