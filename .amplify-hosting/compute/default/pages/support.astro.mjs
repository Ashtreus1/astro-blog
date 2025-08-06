import { c as createComponent, f as createAstro, g as addAttribute, h as renderHead, e as renderComponent, r as renderTemplate } from '../chunks/astro/server_DUQ9axT8.mjs';
import 'kleur/colors';
/* empty css                                 */
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as supabase } from '../chunks/supabaseClient_u6czMeHD.mjs';
import { M as MessageBox } from '../chunks/MessageBox_phxlR_oy.mjs';
export { renderers } from '../renderers.mjs';

function TicketSidebar({ selected, onSelect }) {
  const [tickets, setTickets] = useState([]);
  useEffect(() => {
    supabase.from("tickets").select("*").then((r) => {
      if (!r.error && r.data) setTickets(r.data);
    });
    const sub = supabase.channel("tickets").on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, (payload) => {
      setTickets((prev) => {
        switch (payload.eventType) {
          case "INSERT":
            return [...prev, payload.new];
          case "UPDATE":
            return prev.map((t) => t.id === payload.new.id ? payload.new : t);
          case "DELETE":
            return prev.filter((t) => t.id !== payload.old.id);
          default:
            return prev;
        }
      });
    }).subscribe();
    return () => void supabase.removeChannel(sub);
  }, []);
  return /* @__PURE__ */ jsx("aside", { className: "w-1/4 border-r overflow-y-auto h-full", children: /* @__PURE__ */ jsx("ul", { children: tickets.map((ticket) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => onSelect(ticket),
      className: `w-full text-left p-4 hover:bg-gray-100 ${selected?.id === ticket.id ? "bg-blue-100" : ""}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: ticket.name }),
        /* @__PURE__ */ jsx("div", { className: "text-sm", children: ticket.issue }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: ticket.status })
      ]
    }
  ) }, ticket.id)) }) });
}

function ChatPanel() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    supabase.from("tickets").select("*").then(({ data }) => {
      if (data) {
        setTickets(data);
        setSelected(data[0] ?? null);
      }
    });
    const ticketSub = supabase.channel("tickets").on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "tickets" },
      (p) => setTickets((t) => [...t, p.new])
    ).subscribe();
    return () => ticketSub.unsubscribe();
  }, []);
  useEffect(() => {
    if (!selected) return;
    supabase.from("messages").select("*").eq("ticket_id", selected.id).order("created_at", { ascending: true }).then(({ data }) => data && setMessages(data));
    const chan = supabase.channel(`messages-${selected.id}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `ticket_id=eq.${selected.id}` },
      (p) => setMessages((m) => [...m, p.new])
    ).subscribe();
    return () => chan.unsubscribe();
  }, [selected]);
  const appendMessage = (m) => setMessages((prev) => [...prev, m]);
  return /* @__PURE__ */ jsxs("div", { className: "flex h-full", children: [
    /* @__PURE__ */ jsx(TicketSidebar, { tickets, selected, onSelect: setSelected }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col", children: selected ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "border-b p-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: selected.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: `${selected.issue} – ${selected.status}` })
      ] }),
      /* @__PURE__ */ jsx(MessageBox, { ticketId: selected.id, messages, appendMessage, senderType: "support" })
    ] }) : /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center text-gray-500", children: "No tickets yet." }) })
  ] });
}

const $$Astro = createAstro();
const $$Support = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Support;
  return renderTemplate`<html lang="en"> <head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="viewport" content="width=device-width"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>Support Chat</title>${renderHead()}</head> <body class="h-screen m-0"> <main class="h-full w-full"> ${renderComponent($$result, "ChatPanel", ChatPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/react-components/ChatPanel", "client:component-export": "default" })} </main> </body></html>`;
}, "/home/keiru/Documents/chatdesk/src/pages/support.astro", void 0);

const $$file = "/home/keiru/Documents/chatdesk/src/pages/support.astro";
const $$url = "/support";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Support,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
