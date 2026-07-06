import express from "express";
import { buildSamvaadGraph } from "../agent/graph.js";
import sessionStore from "../store/SessionStore.js";
import aiService from "../agent/ai/AIService.js";

const router = express.Router();

const graph = buildSamvaadGraph();
const inFlightRequests = new Map();

/**
 * SAFE INTENT HELPERS
 */
function isGreeting(text) {
  return ["hi", "hello", "hey", "thanks", "thank you"].includes(
    text.toLowerCase()
  );
}

function isRepoRelated(text) {
  const t = text.toLowerCase();

  return (
    t.includes("repo") ||
    t.includes("repository") ||
    t.includes("readme") ||
    t.includes("file") ||
    t.includes("code") ||
    t.includes("test") ||
    t.includes("function") ||
    t.includes("class") ||
    t.includes("project")
  );
}

router.post("/chat", async (req, res) => {
  const { sessionId, repoName, question } = req.body;
  const safeQuestion = (question || "").trim().toLowerCase();
  const requestKey = `${sessionId}|${repoName}|${safeQuestion}`;

  if (inFlightRequests.has(requestKey)) {
    console.log("COALESCING duplicate request:", requestKey);
    const cachedResponse = await inFlightRequests.get(requestKey);
    return res.json(cachedResponse);
  }

  const responsePromise = (async () => {
    try {
      const session = await sessionStore.get(sessionId);

      if (!session) {
        return {
          success: false,
          response: "Session expired. Please login again."
        };
      }

      // -----------------------------
      // DYNAMIC INTENT DETECTION (LLM)
      // -----------------------------
      async function detectIntent(text) {
        try {
          const result = await aiService.chat({
            systemPrompt: `You are an intent classifier. Return ONLY valid JSON with the shape {"intent": "greeting" | "smalltalk" | "repo_question" | "other"}. Do NOT include any other text.`,
            userPrompt: text,
            temperature: 0
          });

          const cleaned = (result || "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return (parsed.intent || "").toLowerCase();
        } catch (e) {
          console.warn("Intent detection failed, falling back to static check:", e && e.message ? e.message : e);
          return null;
        }
      }

      // If LLM classifies the input as a greeting or smalltalk, produce a dynamic quick reply
      const detected = await detectIntent(safeQuestion);
      console.log("DEBUG: Intent detected:", detected);

      if (detected === "greeting") {
        try {
          const greet = await aiService.chat({
            systemPrompt: `You are a friendly assistant. The user has just greeted you. Provide a short greeting and 3 concise example questions the user can ask about their repository (one line each). Do NOT use markdown.`,
            userPrompt: `Repository: ${repoName || "(none)"}\nUser: ${session.user?.login || "user"}`,
            temperature: 0.2
          });

          return {
            success: true,
            response: (greet || "Hi 👋 I’m Samvaad. Ask me about your repository.")
          };
        } catch (e) {
          return {
            success: true,
            response: "Hi 👋 I’m Samvaad. Ask me about your repository."
          };
        }
      }

      if (detected === "smalltalk") {
        try {
          const chit = await aiService.chat({
            systemPrompt: `You are a friendly conversational assistant. The user said something casual. Reply briefly (1-2 sentences) and then offer 2 example repository-related questions the user can ask. Do NOT use markdown.`,
            userPrompt: question || safeQuestion,
            temperature: 0.4
          });

          return {
            success: true,
            response: (chit || "Nice to meet you! You can ask me about any repository you have access to.")
          };
        } catch (e) {
          return {
            success: true,
            response: "Nice to meet you! You can ask me about any repository you have access to."
          };
        }
      }

      // Fallback: if detection failed, keep old lightweight greeting check
      if (!detected && isGreeting(safeQuestion)) {
        return {
          success: true,
          response: "Hi 👋 I’m Samvaad. Ask me about your repository."
        };
      }

      const github = {
        owner: session.user.login,
        repo: repoName,
        token: session.token
      };

      // -----------------------------
      // GRAPH INPUT STATE
      // -----------------------------
      const initialState = {
        input: safeQuestion,
        context: { sessionId, repoName, github },
        github,
        plan: {},
        toolResults: {},
        evidence: {},
        memory: {},
        action: "",
        iteration: 0,
        maxIterations: 5,
        finalResponse: "",
        executedTools: []
      };

      // -----------------------------
      // RUN GRAPH
      // -----------------------------
      const result = await graph.invoke(initialState);

      return {
        success: true,
        response: result.finalResponse
      };
    } catch (err) {
      console.error("🔥 ERROR:", err);
      return {
        success: false,
        response: "Backend error occurred"
      };
    }
  })();

  inFlightRequests.set(requestKey, responsePromise);

  try {
    const responsePayload = await responsePromise;
    return res.json(responsePayload);
  } finally {
    inFlightRequests.delete(requestKey);
  }
});

export default router;