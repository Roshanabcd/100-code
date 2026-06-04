// Cognitive Orchestrator - The Brain of JARVIS
// Handles memory, planning, and task decomposition

export async function POST(request) {
  try {
    const { userInput, sessionId, context = {} } = await request.json();

    // System prompt for JARVIS cognitive planning
    const systemPrompt = `You are JARVIS, an advanced AI assistant. You understand Hindi, Nepali, and English (including mixed language).

Your capabilities:
- Break down complex multi-step tasks into executable actions
- Remember context from the conversation
- Ask clarifying questions ONLY when truly necessary
- Provide concise, actionable responses

When given a command, respond with a JSON plan in this format:
{
  "intent": "description of what user wants",
  "needsClarification": false,
  "clarificationQuestion": null,
  "steps": [
    {"action": "action_type", "params": {...}},
    ...
  ],
  "response": "What you'll say to the user"
}

Available action types:
- open_app: {appName: "WhatsApp"}
- send_message: {contact: "Roshan", message: "text"}
- make_call: {contact: "Dad", type: "voice"}
- search_web: {query: "text"}
- set_reminder: {time: "7 PM", message: "text"}
- ask_llm: {question: "text"}

Be direct. Execute when possible. Only ask questions if absolutely necessary.`;

    // Call AI provider with cognitive planning prompt
    const aiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_CREATE_APP_URL || "http://localhost:3000"}/api/jarvis/ai-providers`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput },
          ],
          temperature: 0.3, // Lower temperature for more deterministic planning
        }),
      },
    );

    const aiResult = await aiResponse.json();

    if (!aiResult.success) {
      return Response.json(
        {
          error: "AI provider failed",
          details: aiResult,
        },
        { status: 500 },
      );
    }

    // Try to parse JSON plan from AI response
    let plan;
    try {
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: treat as simple response
        plan = {
          intent: "general_query",
          needsClarification: false,
          steps: [{ action: "respond", params: { text: aiResult.text } }],
          response: aiResult.text,
        };
      }
    } catch (parseError) {
      plan = {
        intent: "general_query",
        needsClarification: false,
        steps: [{ action: "respond", params: { text: aiResult.text } }],
        response: aiResult.text,
      };
    }

    // Log to MongoDB
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_CREATE_APP_URL || "http://localhost:3000"}/api/jarvis/mongodb`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "store_message",
            data: {
              sessionId,
              role: "user",
              content: userInput,
              timestamp: new Date(),
            },
          }),
        },
      );

      await fetch(
        `${process.env.NEXT_PUBLIC_CREATE_APP_URL || "http://localhost:3000"}/api/jarvis/mongodb`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "store_message",
            data: {
              sessionId,
              role: "assistant",
              content: plan.response,
              timestamp: new Date(),
              metadata: {
                provider: aiResult.provider,
                latency: aiResult.latency,
              },
            },
          }),
        },
      );
    } catch (mongoError) {
      console.error("[Cognitive] MongoDB logging failed:", mongoError);
    }

    return Response.json({
      success: true,
      plan,
      provider: aiResult.provider,
      latency: aiResult.latency,
    });
  } catch (error) {
    console.error("[Cognitive] Error:", error);
    return Response.json(
      {
        error: "Cognitive processing failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
