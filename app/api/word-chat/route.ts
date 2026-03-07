import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface WordChatRequest {
  word: string;
  category: string;
  frequency: number;
  messages: ChatMessage[];
}

// Gemini uses 'model' instead of 'assistant'
interface GeminiPart { text: string }
interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[] }

// Ordered preference list — first one found wins
const PREFERRED_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-001',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-pro',
];

// Resolves the best available model for this API key at call time.
// Caches the result in module scope so we only call ListModels once per cold start.
let cachedModel: string | null = null;

async function resolveModel(apiKey: string): Promise<string> {
  if (cachedModel) return cachedModel;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      const available: string[] = (data.models ?? [])
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: { name: string }) => m.name.replace('models/', ''));

      const best = PREFERRED_MODELS.find((m) => available.includes(m)) ?? available[0];
      if (best) {
        cachedModel = best;
        console.log(`[word-chat] Resolved Gemini model: ${best}`);
        return best;
      }
    }
  } catch {
    // fall through to default
  }

  // Fallback if ListModels fails — will surface a clear error from generateContent
  return 'gemini-2.0-flash';
}

// Fallback definitions when no API key is available
const FALLBACK_DEFINITIONS: Record<string, string> = {
  ransomware:
    "Ransomware is malicious software that encrypts a victim's files, demanding payment for the decryption key. Financial institutions are prime targets due to the sensitivity of their data and pressure to restore operations quickly.",
  phishing:
    'Phishing is a cyberattack where criminals impersonate trusted entities via email, SMS, or fake websites to steal credentials or financial information. Banking phishing often mimics legitimate institutions to capture login credentials.',
  skimming:
    'ATM skimming involves attaching a device to an ATM or POS terminal that captures card data when customers swipe their cards. Criminals then clone the cards or sell the stolen data on underground markets.',
  malware:
    'Malware (malicious software) is any program designed to disrupt, damage, or gain unauthorized access to systems. In banking contexts, malware may capture keystrokes, intercept transactions, or exfiltrate customer data.',
  breach:
    'A data breach is an incident where unauthorized parties gain access to sensitive, protected, or confidential data. For financial institutions, breaches often expose customer account information, PII, and financial records.',
  fraud:
    'Financial fraud encompasses a wide range of illegal schemes designed to steal money or assets. Common types include wire fraud, check fraud, account takeover, synthetic identity fraud, and business email compromise.',
  robbery:
    'Bank robbery is the physical theft of money or assets from a financial institution. Modern bank robberies often involve armed perpetrators, though cyber-enabled robbery (wire fraud, unauthorized transfers) is increasingly common.',
  jackpotting:
    "ATM jackpotting is a sophisticated attack where criminals install malware or use hardware to force ATMs to dispense cash on demand. The technique requires either physical access to the ATM or compromising the network it's connected to.",
  hack:
    'Hacking in the financial context refers to unauthorized access to banking systems, networks, or applications. Sophisticated threat actors may exploit software vulnerabilities, stolen credentials, or social engineering to gain access.',
  cyber:
    'Cyber threats to financial institutions include a broad spectrum of attacks: DDoS attacks, insider threats, supply chain compromises, and nation-state espionage targeting critical financial infrastructure.',
  atm:
    'ATM (Automated Teller Machine) attacks encompass skimming devices, card trapping, cash trapping, jackpotting, and logical attacks. Financial institutions must balance ATM availability with security hardening measures.',
  theft:
    'Financial theft takes many forms including identity theft, account takeover, wire transfer fraud, and physical cash theft. Criminals increasingly leverage digital methods to steal from financial institutions and their customers.',
  bank:
    'Banking security threats include both physical and cyber dimensions — from traditional robbery to sophisticated cyberattacks targeting SWIFT systems, core banking platforms, and customer-facing applications.',
};

function getFallbackDefinition(word: string): string {
  const lower = word.toLowerCase();
  if (FALLBACK_DEFINITIONS[lower]) return FALLBACK_DEFINITIONS[lower];
  return `"${word}" is a term appearing frequently in banking security and financial crime intelligence feeds. It relates to threats or incidents monitored across financial institutions. Use the chat below to ask specific questions about this topic.`;
}

export async function POST(req: NextRequest) {
  const body: WordChatRequest = await req.json();
  const { word, category, frequency, messages } = body;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    if (messages.length === 0) {
      return NextResponse.json({ content: getFallbackDefinition(word) });
    }
    return NextResponse.json({
      content: 'AI chat is not configured — GEMINI_API_KEY is not set in environment variables.',
    });
  }

  const systemPrompt = `You are a concise financial security intelligence analyst specializing in banking crime and cyber threats. Your role is to explain terms and answer questions relevant to financial institutions, security professionals, and banking executives.

Context: The user clicked on the word "${word}" (category: ${category}, frequency: ${frequency} mentions) in a live intelligence dashboard tracking banking security incidents.

Guidelines:
- Be concise and direct — 2-4 sentences for definitions, 3-6 sentences for follow-up answers
- Focus on the banking/financial institution context specifically
- Use professional but accessible language (no unnecessary jargon)
- When relevant, mention detection, prevention, or response considerations
- Do not repeat the word's definition if the conversation has already covered it`;

  // If no prior messages, inject the initial definition request
  const baseMessages: ChatMessage[] =
    messages.length === 0
      ? [{ role: 'user', content: `Provide a concise definition and banking-specific context for: "${word}"` }]
      : messages;

  // Convert to Gemini format: 'assistant' → 'model'
  const geminiContents: GeminiContent[] = baseMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const modelToUse = await resolveModel(apiKey);

  const requestBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: geminiContents,
    generationConfig: { maxOutputTokens: 512, temperature: 0.4 },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(25000),
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      // Parse and surface the real Google error so it's visible in the UI
      let errorDetail = `HTTP ${response.status}`;
      try {
        const errJson = JSON.parse(responseText);
        const msg = errJson?.error?.message;
        const status = errJson?.error?.status;
        if (msg) errorDetail = status ? `${status}: ${msg}` : msg;
      } catch { /* keep the HTTP status fallback */ }

      console.error(`[word-chat] Gemini error: ${errorDetail}`);
      return NextResponse.json({
        content: messages.length === 0
          ? getFallbackDefinition(word)
          : `Gemini API error — ${errorDetail}`,
      });
    }

    const data = JSON.parse(responseText);
    const content: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!content) {
      const reason = data?.candidates?.[0]?.finishReason ?? 'unknown';
      console.error(`[word-chat] Gemini empty response, finishReason: ${reason}`);
      return NextResponse.json({
        content: messages.length === 0
          ? getFallbackDefinition(word)
          : `Empty response from Gemini (finishReason: ${reason}). Please try again.`,
      });
    }

    return NextResponse.json({ content });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    console.error('[word-chat] Fetch error:', err);
    return NextResponse.json({
      content: messages.length === 0
        ? getFallbackDefinition(word)
        : isTimeout
          ? 'Request timed out — please try again.'
          : 'Network error reaching Gemini — please try again.',
    });
  }
}
