import type { APIRoute } from 'astro';
import Together from 'together-ai';
import { supabase } from '@/lib/supabaseClient';

const together = new Together({
  apiKey: import.meta.env.TOGETHER_API_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { ticketId, userMessage, priority } = await request.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const sanitizedMessage = userMessage.trim().slice(0, 1000);

    // Only allow bot to respond automatically if priority is "Low"
    if (priority !== 'Low') {
      return new Response(JSON.stringify({ error: 'Only low-priority messages are supported' }), { status: 403 });
    }

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

After providing your response, add EXACTLY ONE of the following lines at the end:
RESOLUTION_STATUS: resolved   // if the issue is fully solved
RESOLUTION_STATUS: escalate   // if the issue needs a human support agent
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

    const rawReply = chat.choices?.[0]?.message?.content?.trim();

    if (!rawReply) {
      return new Response(JSON.stringify({ error: 'No response from assistant' }), { status: 502 });
    }

    // Detect resolution status from bot's reply
    let resolutionStatus: 'resolved' | 'escalate' | null = null;
    const statusMatch = rawReply.match(/RESOLUTION_STATUS:\s*(resolved|escalate)/i);
    if (statusMatch) {
      resolutionStatus = statusMatch[1].toLowerCase() as 'resolved' | 'escalate';
    }

    // Clean reply before saving (remove status line for user)
    const cleanedReply = rawReply.replace(/RESOLUTION_STATUS:.*$/i, '').trim();

    if (ticketId) {
      // Save bot reply to messages
      const { error: msgError } = await supabase.from('messages').insert([
        {
          ticket_id: ticketId,
          content: cleanedReply,
          sender: 'support',
        }
      ]);

      if (msgError) {
        console.error('Supabase insert error:', msgError.message);
        return new Response(JSON.stringify({ error: 'Failed to save reply' }), { status: 500 });
      }

      // Handle auto-resolve or escalation
      if (resolutionStatus === 'resolved') {
        await supabase
          .from('tickets')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', ticketId);
      } else if (resolutionStatus === 'escalate') {
        // Assign to first available agent
        const { data: agents } = await supabase
          .from('agents')
          .select('id')
          .eq('is_available', true)
          .limit(1);

        if (agents && agents.length > 0) {
          await supabase
            .from('tickets')
            .update({
              status: 'Assigned',
              agent_id: agents[0].id,
            })
            .eq('id', ticketId);
        }
      }

      return new Response(JSON.stringify({ success: true, reply: cleanedReply }), { status: 200 });
    }

    // If no ticketId, just return reply
    return new Response(JSON.stringify({ reply: cleanedReply }), { status: 200 });

  } catch (err) {
    console.error('Bot unified error:', err);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), { status: 500 });
  }
};
