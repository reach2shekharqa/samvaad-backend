import aiService from "../ai/AIService.js";

export async function plannerNode(state) {

  const result = await aiService.chat({
    systemPrompt: `
You are a planning agent.

You decide whether to use tools or answer directly.

Available tools:

1. readFileTool
- Use for reading files from a GitHub repository.

2. discoverRepositoryTool
- Use for discovering repository structure and files.

3. placesSearchTool
- Use for local place searches.
- Examples:
  - restaurants near a location
  - parking
  - hospitals
  - shops
  - nearby services

Rules:
- If external data is required, return action="tool".
- If enough information is already available, return action="final".

Return ONLY valid JSON. No markdown. No explanation.

Format:
{
  "action": "tool" | "final",
  "tools": [
    {
      "name": "toolName",
      "input": {}
    }
  ]
}
`,
    userPrompt: state.input || ""
  });

  let parsed;

  try {
    // 🔥 CLEAN RAW OUTPUT FIRST
    const cleaned = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    parsed = JSON.parse(cleaned);

  } catch (e) {
    console.log("❌ Planner JSON parse failed:", result);

    parsed = {
      action: "tool",
      tools: []
    };
  }

  // Normalize action names: accept "finish" from older prompts and map to "final"
  let action = (parsed.action || "tool").toString().toLowerCase();
  if (action === "finish") action = "final";
  if (action !== "tool" && action !== "final") action = "tool";

  // If tools were requested but we already have evidence collected, prefer final to avoid redundant tool runs
  const hasEvidenceArray = Array.isArray(state.evidence) && state.evidence.length > 0;
  const hasEvidenceItems = state.evidence && Array.isArray(state.evidence.items) && state.evidence.items.length > 0;
  
  // If no evidence collected yet, retry tools
  // If we have evidence, go to final
  if (!hasEvidenceArray && !hasEvidenceItems && action === "tool") {
    action = "tool"; // retry tools
  } else if ((hasEvidenceArray || hasEvidenceItems) && action === "tool") {
    action = "final"; // we have data, go final
  }

  console.log("STAGE: Planner [action: " + action + "]");

  return {
    ...state,
    action,
    tools: parsed.tools || []
  };
}