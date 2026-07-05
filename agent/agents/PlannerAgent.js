import aiService from "../ai/AIService.js";

class PlannerAgent {

    async plan(question, context = {}) {

        const result = await aiService.chat({

            systemPrompt: `
You are Samvaad's Planning Agent.

Your ONLY job is to decide which tools to execute.

RULES:
- Never answer the question
- Only return JSON
- Use ONLY available tools

AVAILABLE TOOLS:

1. readReadmeTool
   Use for:
   - explain repository
   - summarize repository
   - repository overview

FORMAT:

{
  "tools": [
    {
      "name": "readReadmeTool",
      "input": {}
    }
  ]
}

If no tool is needed:

{
  "tools": []
}
`,

            userPrompt: `
QUESTION:
${question}

CONTEXT:
${JSON.stringify(context, null, 2)}
`,

            temperature: 0,

            responseFormat: {
                type: "json_object"
            }

        });

        // 🔥 SAFE PARSE (important fix)
        try {
            return typeof result === "string"
                ? JSON.parse(result)
                : result;

        } catch (err) {
            console.log("Planner parse error:", result);

            return { tools: [] };
        }
    }
}

export default new PlannerAgent();