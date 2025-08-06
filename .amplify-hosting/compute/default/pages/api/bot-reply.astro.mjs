import Together from 'together-ai';
import { s as supabase } from '../../chunks/supabaseClient_u6czMeHD.mjs';
export { renderers } from '../../renderers.mjs';

const together = new Together({
  apiKey: "tgp_v1_k4X4tSrx3oxaXahjXYMYJxatR5s0_8NoHnR811EMWVQ"
});
const POST = async ({ request }) => {
  try {
    const { ticketId, userMessage } = await request.json();
    if (!ticketId || !userMessage || typeof userMessage !== "string") {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }
    const sanitizedMessage = userMessage.trim().slice(0, 1e3);
    const promptMessages = [
      {
        role: "system",
        content: `
You are a technical support assistant. Your ONLY job is to address the customer's *reported technical issue*.
You MUST NOT answer:
- Casual conversation
- Personal questions
- Off-topic requests
- Questions unrelated to the issue

IF the customer's message is unrelated to a support issue, you MUST respond with:
"I'm only able to assist with the issue reported in your support ticket. Please stay on topic."

Guidelines:
- NEVER repeat the user's message.
- DO NOT provide explanations or responses to irrelevant questions.
- ALWAYS be concise, helpful, and professional.
- ONLY provide troubleshooting steps, clarifications, or follow-up questions strictly related to the issue.

If no technical issue is detected in the message, respond with a polite refusal as described above.
        `.trim()
      },
      {
        role: "user",
        content: sanitizedMessage
      }
    ];
    const chat = await together.chat.completions.create({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: promptMessages
    });
    const reply = chat.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      console.warn("Bot returned empty response");
      return new Response(JSON.stringify({ error: "No response from assistant" }), { status: 502 });
    }
    const { error } = await supabase.from("messages").insert([
      {
        ticket_id: ticketId,
        content: reply,
        sender: "support"
      }
    ]);
    if (error) {
      console.error("Supabase insert error:", error.message);
      return new Response(JSON.stringify({ error: "Failed to save reply" }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true, reply }), { status: 200 });
  } catch (err) {
    console.error("Bot follow-up error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
