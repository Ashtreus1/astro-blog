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

    // Get comprehensive message history for context
    const { data: messageHistory } = await supabase
      .from('messages')
      .select('content, sender, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    // Get original ticket information for context
    const { data: ticketInfo } = await supabase
      .from('tickets')
      .select('issue, status, priority')
      .eq('id', ticketId)
      .single();

    // Build comprehensive conversation context
    let conversationContext = '';
    if (ticketInfo) {
      conversationContext = `Original Issue: ${ticketInfo.issue}\n\n`;
    }
    
    if (messageHistory && messageHistory.length > 0) {
      conversationContext += 'Conversation History:\n';
      conversationContext += messageHistory
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n') + '\n\n';
    }

    const analysisPrompt = [
      {
        role: 'system',
        content: `
You are a technical support AI assistant. Your primary goal is to have helpful, contextual conversations with customers about their technical issues.

CONVERSATION APPROACH:
- Provide helpful, specific technical support responses
- Build rapport and understanding through multiple exchanges
- Ask clarifying questions when needed
- Offer step-by-step solutions
- Follow up on previous suggestions

STATUS ANALYSIS RULES:
Only mark for status change when there are CLEAR INDICATORS:

RESOLVED indicators:
- Customer explicitly says "it's working now", "problem solved", "thank you, that fixed it"
- Customer confirms multiple solution steps worked successfully
- Customer expresses clear satisfaction after receiving help
- Issue appears completely resolved based on customer confirmation

ESCALATED indicators:
- Customer explicitly requests human support ("I want to speak to someone")
- Customer expresses frustration after multiple failed attempts
- Issue is clearly beyond automated support (complex system configurations, account access issues)
- Customer indicates urgency or business impact
- Technical issue requires specialized knowledge or manual intervention

CONTINUE CONVERSATION indicators (DEFAULT):
- Customer asks follow-up questions
- Customer needs clarification on solutions
- Issue partially resolved but needs more work
- Customer trying suggested solutions
- General inquiries or information gathering
- Anything that doesn't clearly indicate resolution or need for escalation

RESPONSE FORMAT:
Provide your helpful support response, then add exactly ONE of these lines:
STATUS_ANALYSIS: RESOLVED    // Only when customer clearly confirms issue is fixed
STATUS_ANALYSIS: ESCALATED   // Only when clear escalation signals present
STATUS_ANALYSIS: CONTINUE    // Default - keep conversation going

Guidelines:
- Be conversational and helpful
- Reference previous messages in your responses
- Ask follow-up questions to better understand the issue
- Provide step-by-step instructions when appropriate
- Don't rush to resolve or escalate - focus on helping the customer
- Default to CONTINUE unless there are clear resolution/escalation signals
        `.trim(),
      },
      {
        role: 'user',
        content: `${conversationContext}Customer's latest message: ${sanitizedMessage}

Please analyze the conversation context and respond appropriately.`,
      }
    ];

    // Use Meta Llama model for contextual support responses
    const chat = await together.chat.completions.create({
      model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
      messages: analysisPrompt,
      max_tokens: 600,
      temperature: 0.7,
    });

    const rawReply = chat.choices?.[0]?.message?.content?.trim();

    if (!rawReply) {
      return new Response(JSON.stringify({ error: 'No response from assistant' }), { status: 502 });
    }

    // Extract status analysis
    let statusAnalysis: 'RESOLVED' | 'ESCALATED' | 'CONTINUE' | null = null;
    const statusMatch = rawReply.match(/STATUS_ANALYSIS:\s*(RESOLVED|ESCALATED|CONTINUE)/i);
    if (statusMatch) {
      statusAnalysis = statusMatch[1].toUpperCase() as 'RESOLVED' | 'ESCALATED' | 'CONTINUE';
    } else {
      // Default to CONTINUE if no status is detected
      statusAnalysis = 'CONTINUE';
    }

    // Clean the reply (remove status line)
    const cleanedReply = rawReply.replace(/STATUS_ANALYSIS:.*$/i, '').trim();

    // Save bot reply to messages
    const { error: msgError } = await supabase.from('messages').insert([
      {
        ticket_id: ticketId,
        content: cleanedReply,
        sender: 'support',
        created_at: new Date().toISOString(),
      }
    ]);

    if (msgError) {
      console.error('Failed to save bot message:', msgError);
      return new Response(JSON.stringify({ error: 'Failed to save reply' }), { status: 500 });
    }

    // Handle status updates based on analysis
    let statusChanged = false;

    if (statusAnalysis === 'RESOLVED') {
      // Update ticket to resolved status
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (!updateError) {
        statusChanged = true;
        
        // Add a system message about resolution
        await supabase.from('messages').insert([
          {
            ticket_id: ticketId,
            content: '🎉 Great! This ticket has been marked as resolved. If you need further assistance, please feel free to create a new support ticket.',
            sender: 'support',
            created_at: new Date().toISOString(),
          }
        ]);
      } else {
        console.error('Failed to resolve ticket:', updateError);
      }

    } else if (statusAnalysis === 'ESCALATED') {
      // Update ticket to Open status and change priority to Medium
      const { error: escalateError } = await supabase
        .from('tickets')
        .update({
          status: 'Open',
          priority: 'Medium',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (!escalateError) {
        statusChanged = true;

        // Try to assign to an available agent
        const { data: agents } = await supabase
          .from('agents')
          .select('id')
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

        // Add a system message about escalation
        await supabase.from('messages').insert([
          {
            ticket_id: ticketId,
            content: '📈 I\'ve escalated your ticket to our human support team. A support agent will be with you shortly to provide specialized assistance.',
            sender: 'support',
            created_at: new Date().toISOString(),
          }
        ]);
      } else {
        console.error('Failed to escalate ticket:', escalateError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      reply: cleanedReply,
      statusAnalysis: statusAnalysis,
      statusChanged: statusChanged
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('Enhanced bot API error:', err);
    return new Response(JSON.stringify({ error: 'Server error occurred' }), { status: 500 });
  }
};