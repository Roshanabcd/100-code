// Multi-Provider AI with Fallback Chain
// Priority: OpenRouter → NVIDIA NIM → Gemini → OpenAI → Local Parser

const AI_PROVIDERS = [
  {
    name: "OPENROUTER",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "deepseek/deepseek-v4-flash:free",
    apiKey: process.env.OPENROUTER_API_KEY || null, // Free tier
    priority: 1,
  },
  {
    name: "NVIDIA_NIM",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: "nvidia/llama-3.1-nemotron-70b-instruct",
    apiKey:
      process.env.NVIDIA_API_KEY ||
      "nvapi-BvZzhCqaQ8z08Q21_vzXiO0q3FLJgR3GRm0XDUKjwMV",
    priority: 2,
  },
  {
    name: "GEMINI",
    endpoint:
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
    model: "gemini-2.0-flash-exp",
    apiKey:
      process.env.GEMINI_API_KEY || "AIzaSyAj0FWl9NNDfy8Jwh4AXHmqiODC2XpnVU8",
    priority: 3,
  },
  {
    name: "OPENAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    apiKey:
      process.env.OPENAI_API_KEY ||
      "sk-proj-J3VBehbKiYC3KHB0VWThyMeCeViJ1cAwJhEqmxpX65",
    priority: 4,
  },
];

async function callProvider(provider, messages, temperature = 0.7) {
  const startTime = Date.now();

  try {
    let requestBody;
    let headers;

    if (provider.name === "GEMINI") {
      // Gemini uses different format
      requestBody = {
        contents: messages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature,
          maxOutputTokens: 2048,
        },
      };
      headers = {
        "Content-Type": "application/json",
      };
    } else {
      // OpenAI-compatible format
      requestBody = {
        model: provider.model,
        messages,
        temperature,
        max_tokens: 2048,
      };
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      };
    }

    const url =
      provider.name === "GEMINI"
        ? `${provider.endpoint}?key=${provider.apiKey}`
        : provider.endpoint;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: provider.name,
        error: `HTTP ${response.status}: ${response.statusText}`,
        errorDetails: errorText,
        latency,
        statusCode: response.status,
      };
    }

    const data = await response.json();

    let text;
    if (provider.name === "GEMINI") {
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      text = data.choices?.[0]?.message?.content || "";
    }

    return {
      success: true,
      provider: provider.name,
      text,
      latency,
      model: provider.model,
    };
  } catch (error) {
    return {
      success: false,
      provider: provider.name,
      error: error.message,
      latency: Date.now() - startTime,
    };
  }
}

function localIntentParser(userMessage) {
  const msg = userMessage.toLowerCase();

  // Basic command patterns
  const patterns = {
    open_app: /(?:open|launch|start)\s+(\w+)/i,
    call: /(?:call|phone|dial)\s+(.+)/i,
    message: /(?:send|text|message)\s+(.+?)\s+(?:to|saying)\s+(.+)/i,
    search: /(?:search|google|find)\s+(.+)/i,
    weather: /(?:weather|temperature|forecast)/i,
    time: /(?:time|clock|what time)/i,
  };

  for (const [intent, pattern] of Object.entries(patterns)) {
    const match = msg.match(pattern);
    if (match) {
      return {
        intent,
        entities: match.slice(1),
        confidence: 0.8,
        fallback: true,
      };
    }
  }

  return {
    intent: "unknown",
    entities: [],
    confidence: 0.3,
    fallback: true,
    originalMessage: userMessage,
  };
}

export async function POST(request) {
  try {
    const {
      messages,
      temperature = 0.7,
      forceProvider = null,
    } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Invalid messages format" },
        { status: 400 },
      );
    }

    const providers = forceProvider
      ? AI_PROVIDERS.filter((p) => p.name === forceProvider)
      : AI_PROVIDERS.sort((a, b) => a.priority - b.priority);

    const attempts = [];

    for (const provider of providers) {
      console.log(`[JARVIS AI] Attempting ${provider.name}...`);

      const result = await callProvider(provider, messages, temperature);
      attempts.push(result);

      if (result.success) {
        console.log(
          `[JARVIS AI] ✓ ${provider.name} succeeded in ${result.latency}ms`,
        );
        return Response.json({
          success: true,
          text: result.text,
          provider: result.provider,
          model: result.model,
          latency: result.latency,
          attempts,
        });
      }

      // If rate limited (429), wait 2 seconds before next provider
      if (result.statusCode === 429) {
        console.log(
          `[JARVIS AI] ⚠ ${provider.name} rate limited, switching provider...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.log(`[JARVIS AI] ✗ ${provider.name} failed: ${result.error}`);
      }
    }

    // All providers failed - use local parser
    console.log("[JARVIS AI] All providers failed, using local intent parser");
    const userMessage = messages[messages.length - 1]?.content || "";
    const localResult = localIntentParser(userMessage);

    return Response.json({
      success: true,
      text: `I understand you want to: ${localResult.intent}. However, I'm currently offline. Please try again in a moment.`,
      provider: "LOCAL_PARSER",
      fallback: true,
      intent: localResult,
      attempts,
    });
  } catch (error) {
    console.error("[JARVIS AI] Fatal error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  // Health check endpoint
  return Response.json({
    status: "online",
    providers: AI_PROVIDERS.map((p) => ({
      name: p.name,
      model: p.model,
      priority: p.priority,
      hasKey: !!p.apiKey,
    })),
  });
}
