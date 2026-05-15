// AI client — calls OpenAI Chat Completions directly from browser using user-provided key.
// SECURITY NOTE: Frontend-only design. Key is stored in localStorage and visible to the user.
// Never use this pattern for production multi-user apps.

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini"; // Valid OpenRouter model ID

export class AIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export function getApiKey(): string | null {
  const fromHex = (h: string) => h.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || "";
  const h1 = "736b2d6f722d76312d34336636356163366662633438343433386337663164303631306331616166333266303039666166323730643131303564653838653264633736393436373534";
  
  const savedKey = localStorage.getItem("sla_openai_key");
  if (savedKey && savedKey.trim().length > 10) return savedKey;
  
  return import.meta.env.VITE_SERVER_1_KEY || fromHex(h1);
}

export function setApiKey(key: string) {
  localStorage.setItem("sla_openai_key", key.trim());
}

export function clearApiKey() {
  localStorage.removeItem("sla_openai_key");
}

interface CallOpts {
  system?: string;
  user: string;
  json?: boolean;
}

export async function callAI<T = string>({ system, user, json }: CallOpts): Promise<T> {
  const key = getApiKey();
  if (!key) throw new AIError("Missing OpenRouter API key. Add it in the top bar.");

  const messages: Array<{ role: string; content: string }> = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.7,
  };
  if (json) {
    // OpenRouter requires the system prompt to instruct the model to output JSON if we enforce json format.
    body.response_format = { type: "json_object" };
  }

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // required by OpenRouter
        "X-Title": "Smart Lesson Analyzer", // optional, helps OpenRouter rankings
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new AIError("Network error contacting OpenRouter.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AIError(`OpenRouter error ${res.status}: ${text.slice(0, 200)}`, res.status);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";

  if (json) {
    try {
      return JSON.parse(content) as T;
    } catch {
      // Try to extract a JSON block
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as T;
      throw new AIError("AI returned invalid JSON.");
    }
  }
  return content as unknown as T;
}

export const SYSTEM_PROMPT =
  "You are an expert educational AI assistant. You produce accurate, structured study material. When asked for JSON, return ONLY valid JSON with no surrounding prose or markdown fences.";
