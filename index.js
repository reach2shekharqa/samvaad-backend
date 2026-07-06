import express from "express";
import axios from "axios";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";

import aiRoutes from "./routes/ai.js";
import sessionStore from "./store/SessionStore.js";

dotenv.config();

// Global error handlers to log unexpected crashes
process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION:", err && err.stack ? err.stack : err);
    // keep process exiting after logging
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("UNHANDLED REJECTION:", reason);
});

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// optional request logging (disabled by default)
app.use((req, res, next) => {
    if (process.env.LOG_REQUESTS === "true" && req.url.startsWith("/ai")) {
        const safeBody = JSON.parse(JSON.stringify(req.body || {}));
        try {
            if (safeBody.github && safeBody.github.token) safeBody.github.token = "***REDACTED***";
            if (safeBody.token) safeBody.token = "***REDACTED***";
        } catch (e) {}

        console.log("\n🔥 AI REQUEST:", req.method, req.url);
        console.log("BODY:", safeBody);
    }
    next();
});

// ----------------------
// AI Routes
// ----------------------
app.use("/ai", aiRoutes);

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// TEMP SESSION STORE (DEV ONLY)
// const sessions = {};

/**
 * START OAUTH
 */
app.get("/auth/github", (req, res) => {
    const url =
        "https://github.com/login/oauth/authorize" +
        `?client_id=${CLIENT_ID}` +
        "&scope=read:user repo";

    res.redirect(url);
});

/**
 * CALLBACK
 */
app.get("/auth/github/callback", async (req, res) => {

    const code = req.query.code;

    if (!code) {
        return res.status(400).send("Missing code");
    }

    try {

        const params = new URLSearchParams();

        params.append("client_id", CLIENT_ID);
        params.append("client_secret", CLIENT_SECRET);
        params.append("code", code);

        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            params.toString(),
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            return res.status(400).send("Token exchange failed");
        }

        // USER
        const userResponse = await axios.get(
            "https://api.github.com/user",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        // REPOSITORIES
        const repoResponse = await axios.get(
            "https://api.github.com/user/repos?per_page=100",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        // CREATE SESSION
        const sessionId = crypto.randomUUID();

        await sessionStore.save(sessionId, {
            token: accessToken,
            user: userResponse.data,
            repos: repoResponse.data
        });

        // login successful; do not log user data

        // RETURN TO ANDROID
        res.redirect(`samvaad://callback?sessionId=${sessionId}`);

    } catch (err) {

        console.error(err.response?.data || err.message);

        res.status(500).send("OAuth failed");
    }
});

/**
 * SESSION
 */
app.get("/auth/session/:sessionId", async (req, res) => {

    const session = await sessionStore.get(req.params.sessionId);

    if (!session) {
        return res.status(404).json({
            success: false,
            message: "Session not found"
        });
    }

    res.json({
        success: true,
        user: session.user,
        repos: session.repos
    });

});

/**
 * GET REPOSITORY DETAILS
 */
app.get("/repo/:sessionId/:repoName", async (req, res) => {

    const session = await sessionStore.get(req.params.sessionId);

    if (!session) {
        return res.status(404).json({
            error: "Invalid session"
        });
    }

    const repo = session.repos.find(
        r => r.name === req.params.repoName
    );

    if (!repo) {
        return res.status(404).json({
            error: "Repo not found"
        });
    }

    res.json({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count
    });

});

/**
 * HEALTH
 */
app.get("/", (req, res) => {
    res.send("Samvaad Backend Running 🚀");
});

/**
 * START SERVER
 */
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});