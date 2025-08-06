import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useRef, useEffect } from 'react';
import { I as Input, B as Button } from './input_DPKnW5is.mjs';
import { s as supabase } from './supabaseClient_u6czMeHD.mjs';

function MessageBox({ ticketId, senderType, messages, appendMessage }) {
  const [msg, setMsg] = useState("");
  const containerRef = useRef(null);
  useEffect(() => {
    const chan = supabase.channel(`messages-${ticketId}`).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `ticket_id=eq.${ticketId}`
    }, (payload) => appendMessage(payload.new)).subscribe();
    return () => supabase.removeChannel(chan);
  }, [ticketId, appendMessage]);
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    await supabase.from("messages").insert([
      {
        ticket_id: ticketId,
        content: msg,
        sender: senderType
      }
    ]);
    if (senderType === "customer") {
      await fetch("/api/bot-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, userMessage: msg })
      });
    }
    setMsg("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col flex-1 justify-between h-full p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto space-y-2 mb-4", children: [
      messages.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-400 italic", children: "No messages yet." }) : messages.map((m, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `p-2 rounded max-w-prose text-sm ${m.sender === "support" ? "bg-blue-100" : "bg-green-100"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: m.sender }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500", children: new Date(m.created_at).toLocaleTimeString() })
            ] }),
            /* @__PURE__ */ jsx("div", { children: m.content })
          ]
        },
        i
      )),
      /* @__PURE__ */ jsx("div", { ref: containerRef })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          value: msg,
          onChange: (e) => setMsg(e.currentTarget.value),
          placeholder: "Type message..."
        }
      ),
      /* @__PURE__ */ jsx(Button, { type: "submit", children: "Send" })
    ] })
  ] });
}

export { MessageBox as M };
