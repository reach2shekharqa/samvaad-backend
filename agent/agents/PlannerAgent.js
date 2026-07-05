import aiService from "../ai/AIService.js";

class PlannerAgent {

    async plan(question) {

        const result = await aiService.chat({

            systemPrompt: `
You are Samvaad's Planning Agent.

Your ONLY responsibility is deciding which tools should be executed.

Never answer the user's question.

Available tools:

1. readReadmeTool
   Use for:
   - explain repository
   - summarize repository
   - repository overview
   - what is this project

Return ONLY JSON.

Example:

{
    "tools":[
        {
            "name":"readReadmeTool",
            "input":{}
        }
    ]
}

If no tool is required:

{
    "tools":[]
}
`,

            userPrompt: question,

            temperature: 0,

            responseFormat: {
                type: "json_object"
            }

        });

        return JSON.parse(result);

    }

}

export default new PlannerAgent();