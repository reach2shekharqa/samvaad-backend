import express from "express";
import { buildSamvaadGraph } from "../agent/graph.js";
import sessionStore from "../store/SessionStore.js";

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
      // HANDLE GREETING (FAST PATH)
      // -----------------------------
      if (isGreeting(safeQuestion)) {
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