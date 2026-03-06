/**
 * Mistral AI client — tool-calling agent loop + simple generation.
 * Uses Mistral Small via OpenAI-compatible API.
 */

export interface MistralMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: MistralToolCall[];
  tool_call_id?: string;
}

export interface MistralToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface MistralTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>
) => Promise<unknown>;

export interface AgentConfig {
  systemInstruction: string;
  conversationHistory: MistralMessage[];
  userMessage: string;
  tools: MistralTool[];
  executeTool: ToolExecutor;
  model?: string;
  maxIterations?: number;
  maxTokens?: number;
  toolChoice?: "any" | "auto";
}

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

function getApiKey(): string {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error("MISTRAL_API_KEY is not set");
  return key;
}

async function callMistral(
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Run the Mistral agent with a tool-calling loop.
 * Loops until the model returns a text response or max iterations reached.
 */
export async function runAgent(config: AgentConfig): Promise<string> {
  const {
    systemInstruction,
    conversationHistory,
    userMessage,
    tools,
    executeTool,
    model = "mistral-small-latest",
    maxIterations = 5,
    maxTokens = 4096,
    toolChoice = "auto",
  } = config;

  const messages: MistralMessage[] = [
    { role: "system", content: systemInstruction },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < maxIterations; i++) {
    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens: maxTokens,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: i === 0 && tools.length > 0 ? toolChoice : "auto",
    };

    const data = await callMistral(body);
    const choices = data.choices as Array<{
      message: {
        role: string;
        content: string | null;
        tool_calls?: MistralToolCall[];
      };
      finish_reason: string;
    }>;

    const choice = choices[0];
    if (!choice) break;

    const assistantMsg = choice.message;

    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: assistantMsg.content || "",
        tool_calls: assistantMsg.tool_calls,
      });

      for (const tc of assistantMsg.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        const result = await executeTool(tc.function.name, args);
        messages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: tc.id,
        });
      }
      continue;
    }

    return assistantMsg.content || "";
  }

  console.error("[runAgent] Max iterations reached");
  return "Désolé, je n'ai pas réussi à traiter votre demande. Pouvez-vous reformuler ?";
}
