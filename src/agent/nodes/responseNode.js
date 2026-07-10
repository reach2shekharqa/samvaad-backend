import aiService from "../ai/AIService.js";

export async function responseNode(state) {

    try {

        // -----------------------------
        // SAFETY CHECK
        // -----------------------------
        if (!state.evidence) {
            return {
                ...state,
                finalResponse: "No evidence found to generate summary."
            };
        }

        // -----------------------------
        // BUILD CONTEXT FOR LLM
        // -----------------------------
        const evidence = state.evidence;

        const result = await aiService.chat({
            systemPrompt: `
You are a senior software engineer.

You must generate a clean, structured GitHub repository summary.

RULES:
- Use ONLY provided evidence
- Do NOT hallucinate
- Be precise and factual
- If something is missing, say "Not found in repo"
- Output in markdown format

You are summarizing a repository based on collected evidence JSON.
            `,

            userPrompt: `
REPOSITORY:
${JSON.stringify(state.github, null, 2)}

EVIDENCE:
${JSON.stringify(evidence, null, 2)}

TASK:
Create a professional repository summary including:

1. Project overview
2. Key features
3. Folder structure (if available)
4. Tech stack (if available)
5. Important files or modules
            `,

            temperature: 0
        });

        // -----------------------------
        // FINAL OUTPUT
        // -----------------------------
        return {
            ...state,
            finalResponse: result
        };

    } catch (err) {

        console.error("❌ RESPONSE NODE ERROR:", err);

        return {
            ...state,
            finalResponse: "Failed to generate final summary due to internal error."
        };
    }
}