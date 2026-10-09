import cachedData from '@/data/cachedAnswers.json';
import type { ChatToolInvocation } from '@/types';

interface AskNirnayParams {
  sessionId: string;
  message: string;
  currentScenario: {
    rain_mm: number;
    duration_h: number;
    allocation: any;
  };
  hotspotName?: string;
}

export interface AskNirnayResponse {
  sessionId: string;
  reply: string;
  tools_invoked: ChatToolInvocation[];
  isCached?: boolean;
}

/**
 * Send question to the NIRNAY Q&A API.
 * The endpoint explains simulator and optimizer outputs; it does not make decisions.
 */
export async function askNirnay({
  sessionId,
  message,
  currentScenario,
  hotspotName,
}: AskNirnayParams): Promise<AskNirnayResponse> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${baseUrl}/api/chat`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        session_id: sessionId,
        message,
        current_scenario: currentScenario,
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        sessionId: data.session_id || sessionId,
        reply: data.reply,
        tools_invoked: data.tools_invoked || [],
        isCached: false,
      };
    }
  } catch {
    // Network failure, timeout, or unreachable endpoint -> fallback to cached fixture
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback to grounded cached answers
  const lowerMsg = message.toLowerCase();
  const match = cachedData.answers.find((entry) => {
    return lowerMsg.includes(entry.pattern.toLowerCase());
  });

  if (match) {
    let replyText = match.reply;
    if (hotspotName && replyText.includes('Minto Bridge') && hotspotName !== 'Minto Bridge Underpass') {
      replyText = replyText.replace('Minto Bridge', hotspotName.replace(' Underpass', ''));
    }
    return {
      sessionId,
      reply: replyText,
      tools_invoked: match.tools_invoked as ChatToolInvocation[],
      isCached: true,
    };
  }

  return {
    sessionId,
    reply: "I can't answer that from the simulation outputs right now.",
    tools_invoked: [],
    isCached: true,
  };
}
