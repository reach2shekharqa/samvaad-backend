import aiService from "../ai/AIService.js";

class ResponseAgent {

    async generate(state) {

        const { repository } = state.context;

        // 🔥 Normalize tool results (VERY IMPORTANT)
        const toolResults = (state.toolResults || []).map((t) => ({
            toolName: t.toolName,
            input: t.input,
            success: t.success,
            output: t.output ?? t.data ?? null,
            error: t.error || null
        }));

        // 🔥 Safe JSON stringify helper
        const safeStringify = (data) => {
            try {
                return JSON.stringify(data, null, 2);
            } catch {
                return String(data);
            }
        };

        const prompt = `
Repository Information

Name:
${repository?.name || "Unknown"}

Full Name:
${repository?.full_name || "Unknown"}

Language:
${repository?.language || "Unknown"}

Description:
${repository?.description || "No description"}

---

User Question:
${state.input}

---

Tool Results:
${safeStringify(toolResults)}
`;

        const response = await aiService.chat({
            systemPrompt: `
You are Samvaad, an AI assistant that explains GitHub repositories and helps developers understand codebases.

Rules:
- Use repository context + tool results
- Prefer tool results over assumptions
- If tool output exists, explain it clearly
- If information is missing, say what is missing
- Do NOT return JSON
- Keep responses clear, structured, and helpful
- Do NOT mention internal system or tools
`,

            userPrompt: prompt,
            temperature: 0.2
        });

        // 🔥 FINAL SAFETY CHECK
        return response?.trim?.() || "Unable to generate response.";
    }
}

export default new ResponseAgent();