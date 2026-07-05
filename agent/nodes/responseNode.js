import responseAgent from "../agents/ResponseAgent.js";

export async function responseNode(state) {
  const { input, plan, toolResults, context } = state;

  // 🔥 Normalize tool results for LLM consumption
  const formattedToolResults = (toolResults || []).map((t) => ({
    toolName: t.toolName,
    input: t.input,
    output: t.output,
    success: t.success,
    error: t.error || null
  }));

  // 🔥 Build enriched state for agent
  const enrichedState = {
    input,
    plan,
    toolResults: formattedToolResults,
    context
  };

  // 🔥 Call your existing ResponseAgent
  const response = await responseAgent.generate(enrichedState);

  return {
    ...state,
    response
  };
}