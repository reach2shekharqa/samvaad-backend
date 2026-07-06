import aiService from "../ai/AIService.js";

class PlannerAgent {

  async plan(state) {

    state.iteration = (state.iteration || 0) + 1;
    state.executedTools = state.executedTools || [];

    // HARD STOP
    if (state.iteration >= (state.maxIterations || 4)) {
      return {
        ...state,
        plan: {
          action: "finish",
          tools: []
        }
      };
    }

    const result = await aiService.chat({
      systemPrompt: `
You are a JSON planner that outputs JSON only.

Return ONLY valid JSON.

STRICT RULES:
- No explanations
- No markdown
- No backticks
- No extra text
- Only valid JSON object

OUTPUT FORMAT (ONLY ONE OF THESE):

{"action":"tool","tools":[]}
{"action":"finish","tools":[]}
      `.trim(),

      userPrompt: `
QUESTION: ${state.input}

ITERATION: ${state.iteration}

EXECUTED TOOLS:
${JSON.stringify(state.executedTools)}

EVIDENCE:
${JSON.stringify(state.evidence || [])}
      `.trim(),

      temperature: 0,

      // ✅ FIX 1: correct key
      response_format: {
        type: "json_object"
      }
    });

    let parsed;

    try {
      parsed = JSON.parse(result);
    } catch (e) {
      return {
        ...state,
        plan: {
          action: "finish",
          tools: []
        }
      };
    }

    // safety normalization
    if (!parsed.tools) parsed.tools = [];

    return {
      ...state,
      plan: parsed
    };
  }
}

export const plannerNode = new PlannerAgent().plan;