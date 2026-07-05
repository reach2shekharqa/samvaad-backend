import express from "express";
import { buildSamvaadGraph } from "../agent/graph.js";
import { createInitialState } from "../agent/state.js";
import sessions from "../store/sessionStore.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
    try {

        const { sessionId, repoName, question } = req.body;

        // Validate request
        if (!sessionId || !repoName || !question) {
            return res.status(400).json({
                success: false,
                message: "sessionId, repoName and question are required."
            });
        }

        // Find session
        const session = sessions[sessionId];

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Invalid session."
            });
        }

        // Find selected repository
        const repository = session.repos.find(
            repo => repo.name === repoName
        );

        if (!repository) {
            return res.status(404).json({
                success: false,
                message: "Repository not found."
            });
        }

        // Build LangGraph
        const graph = buildSamvaadGraph();

        // Create graph state
        const state = createInitialState(question, {
            sessionId,
            githubToken: session.token,
            user: session.user,
            repository
        });

        // Invoke graph
        const result = await graph.invoke(state);

        res.json({
            success: true,
            answer: result.response
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

export default router;