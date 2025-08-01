import type { APIRoute } from 'astro';
import Together from 'together-ai';

const together = new Together({
  apiKey: import.meta.env.TOGETHER_API_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userMessage, priority } = await request.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    // Only allow low-priority requests
    if (priority !== 'Low') {
      return new Response(JSON.stringify({ error: 'Only low-priority messages are supported' }), { status: 403 });
    }

    const sanitizedMessage = userMessage.trim().slice(0, 1000);

    const promptMessages = [
      {
        role: 'system',
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
        `.trim(),
      },
      {
        role: 'user',
        content: sanitizedMessage,
      }
    ];

    const chat = await together.chat.completions.create({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages: promptMessages,
    });

    const reply = chat.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.warn('Bot returned empty response');
      return new Response(JSON.stringify({ error: 'No response from assistant' }), { status: 502 });
    }

    return new Response(JSON.stringify({ reply }), { status: 200 });

  } catch (err) {
    console.error('Bot popup error:', err);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), { status: 500 });
  }
};
