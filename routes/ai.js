import express from "express";

import sessionStore from "../store/SessionStore.js";
import aiService from "../src/agent/ai/AIService.js";

import { getWorkspaceGraph } from "../src/agent/workspaceRouter.js";

const router = express.Router();


const inFlightRequests = new Map();

/**
 * SAFE INTENT HELPERS
 */
function isGreeting(text) {
  return ["hi", "hello", "hey", "thanks", "thank you"].includes(
    text.toLowerCase()
  );
}

// function isRepoRelated(text) {
//   const t = text.toLowerCase();

//   return (
//     t.includes("repo") ||
//     t.includes("repository") ||
//     t.includes("readme") ||
//     t.includes("file") ||
//     t.includes("code") ||
//     t.includes("test") ||
//     t.includes("function") ||
//     t.includes("class") ||
//     t.includes("project")
//   );
// }

router.post("/chat", async (req, res) => {
  const {
    sessionId,
    repoName,
    question,
    workspace
  } = req.body;

  console.log("WORKSPACE RECEIVED:", workspace);
  const validWorkspaces = [
    "developer",
    "local"
  ];

  if (!validWorkspaces.includes(workspace)) {
    return res.status(400).json({
      success: false,
      response: "Invalid workspace"
    });
  }
  const safeQuestion = (question || "").trim().toLowerCase();
  const requestKey = `${sessionId}|${repoName}|${safeQuestion}`;
  console.log("REQUEST KEY:", requestKey);

  if (inFlightRequests.has(requestKey)) {

    console.log("COALESCING duplicate request:", requestKey);

    try {
      const cachedResponse = await inFlightRequests.get(requestKey);
      return res.json(cachedResponse);
    } catch (e) {
      // The previous request failed or got stuck.
      // Remove it so the new request can start fresh.
      inFlightRequests.delete(requestKey);
    }
  }

  const responsePromise = (async () => {
    try {
      const session = null;

      if (workspace === "devloper") {

        session = await sessionStore.get(sessionId);

        if (!session) {
          return {
            success: false,
            response: "Session expired. Please login again."
          };
        }
      }



      // -----------------------------
      // DYNAMIC INTENT DETECTION (LLM)
      // -----------------------------
      async function detectIntent(text) {
        try {
          const result = await aiService.chat({
            systemPrompt: `You are an intent classifier. Return ONLY valid JSON with the shape {"intent": "greeting" | "smalltalk" | "repo_question" | "other", "confidence": 0.0-1.0}. Do NOT include any other text.`,
            userPrompt: text,
            temperature: 0
          });

          const cleaned = (result || "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          return { intent: (parsed.intent || "").toLowerCase(), confidence: Number(parsed.confidence) || 0 };
        } catch (e) {
          console.warn("Intent detection failed, falling back to static check:", e && e.message ? e.message : e);
          return { intent: null, confidence: 0 };
        }
      }

      // If LLM classifies the input as a greeting or smalltalk, produce a dynamic quick reply
      const intentResult = await detectIntent(question || "");
      const detected = intentResult.intent;
      const detectedConfidence = intentResult.confidence;
      console.log("DEBUG: Intent detected:", detected, "confidence:", detectedConfidence);

      // If the user recently asked about the same repo in this session, treat ambiguous inputs as repo questions
      try {
        const last = session.lastInteraction || {};
        if ((detected === "other" || !detected) && last.lastIntent === "repo_question" && last.repoName === repoName) {
          console.log("DEBUG: Overriding ambiguous intent to repo_question based on session context");
          detected = "repo_question";
          detectedConfidence = 0.9;
        }
      } catch (e) {
        // ignore
      }

      if (detected === "greeting") {
        try {

          const isDeveloper = workspace === "developer";

          const systemPrompt = isDeveloper
            ? `You are a friendly assistant. The user has just greeted you. Provide a short greeting and 3 concise example questions the user can ask about their repository (one line each). Do NOT use markdown.`
            : `You are a friendly local assistant. The user has just greeted you. Provide a short greeting and 3 concise example questions about places, restaurants, nearby services, or local information (one line each). Do NOT use markdown.`;

          const userPrompt = isDeveloper
            ? `Repository: ${repoName || "(none)"}\nUser: ${session?.user?.login || "user"}`
            : `User: ${session?.user?.login || "user"}`;

          const greet = await aiService.chat({
            systemPrompt,
            userPrompt,
            temperature: 0.2
          });

          return {
            success: true,
            response: (
              greet ||
              (isDeveloper
                ? "Hi 👋 I’m Samvaad. Ask me about your repository."
                : "Hi 👋 I’m Samvaad. I can help you with local places and information.")
            )
          };

        } catch (e) {

          return {
            success: true,
            response:
              workspace === "developer"
                ? "Hi 👋 I’m Samvaad. Ask me about your repository."
                : "Hi 👋 I’m Samvaad. I can help you with local places and information."
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

      // If intent is repo_question but confidence is low or the question is unclear, attempt paraphrase
      if (detected === "repo_question") {
        const rawQuestion = question || "";

        // If confidence low or question is too short / looks like gibberish, ask LLM to paraphrase
        const shouldParaphrase = detectedConfidence < 0.6 || rawQuestion.trim().length < 4 || /[^\w\s\?\.\!\-]/.test(rawQuestion);

        if (shouldParaphrase) {
          try {
            const paraphrase = await aiService.chat({
              systemPrompt: `You are a paraphrasing assistant. Rephrase the user's input into a clear, concise repository-related question. If the input is gibberish or not a repository question, return an empty string. Return ONLY the paraphrased question or empty string, no explanation.`,
              userPrompt: rawQuestion,
              temperature: 0.2
            });

            const cleanedParaphrase = (paraphrase || "").replace(/```/g, "").trim();
            if (!cleanedParaphrase || cleanedParaphrase.length < 3) {
              // Ask for clarification instead of running planner/tools
              const clarify = await aiService.chat({
                systemPrompt: `You are a helpful assistant. The user's question is unclear. Reply with a single short clarification request asking the user to rephrase or confirm they want a repository summary. Do NOT use markdown.`,
                userPrompt: `User input: "${rawQuestion}"\nRepository: ${repoName || "(none)"}`,
                temperature: 0.2
              });

              return {
                success: true,
                response: (clarify || "I didn't understand that. Could you rephrase your question or ask me to summarize the repository?")
              };
            }

            // Replace safeQuestion with paraphrased clearer question for planner
            console.log("DEBUG: Paraphrased question:", cleanedParaphrase);
            // use cleanedParaphrase (keep original casing)
            // update safeQuestion variable used by graph
            // Note: state.input expects lowercased earlier, but planner can handle original casing; keep as-is
            // We'll set a new variable for planner input later
            var plannerInput = cleanedParaphrase;
          } catch (e) {
            console.warn("Paraphrase failed, proceeding with original question:", e && e.message ? e.message : e);
          }
        }
      }

      // If intent is explicitly 'other' (unclear / gibberish), ask for clarification instead
      if (detected === "other") {
        try {
          const clarify = await aiService.chat({
            systemPrompt: `You are a helpful assistant. The user input may be unclear. Return a single short clarification question asking the user to rephrase or confirm they want a repository summary. Do NOT include markdown or extra explanation.`,
            userPrompt: `User input: "${question || ""}"\nRepository: ${repoName || "(none)"}`,
            temperature: 0.2
          });

          return {
            success: true,
            response: (clarify || "I didn't understand that. Could you rephrase your question or ask me to summarize the repository?")
          };
        } catch (e) {
          return {
            success: true,
            response: "I didn't understand that. Could you rephrase your question or ask me to summarize the repository?"
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

      let workspaceContext = {};

      if (workspace === "developer") {

        workspaceContext.github = {
          owner: session.user.login,
          repo: repoName,
          token: session.token
        };

      }

      // -----------------------------
      // GRAPH INPUT STATE
      // -----------------------------
      const initialState = {
        input: typeof plannerInput === 'string' && plannerInput.length > 0
          ? plannerInput
          : safeQuestion,

        context: {
          sessionId,
          repoName,
          ...workspaceContext
        },

        ...workspaceContext,

        plan: {},
        toolResults: {},
        evidence: [],
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

      const graph = getWorkspaceGraph(workspace);
      const result = await graph.invoke(initialState);

      // Save last interaction for session context to help follow-ups
      try {
        const updatedSession = {
          ...session,
          lastInteraction: {
            lastIntent: "repo_question",
            repoName,
            question: question || safeQuestion,
            timestamp: Date.now()
          }
        };

        await sessionStore.save(sessionId, updatedSession);
      } catch (e) {
        console.warn("Failed to save session lastInteraction:", e && e.message ? e.message : e);
      }

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

    console.log("========== SENDING TO ANDROID ==========");
    console.log(JSON.stringify(responsePayload, null, 2));

    res.json(responsePayload);

    console.log("========== SENT ==========");

    return;
  } finally {
    inFlightRequests.delete(requestKey);
  }
});

export default router;