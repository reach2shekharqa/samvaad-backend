import express from "express";
import axios from "axios";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";

import pool from "./src/db/db.js";

import aiRoutes from "./routes/ai.js";
import sessionStore from "./store/SessionStore.js";

import { registerTools } from "./src/agent/tools/registerTools.js";

import toolManager from "./src/agent/tools/ToolManager.js";

import dayRoutes from "./routes/day.js";

dotenv.config();
registerTools();
console.log(
    "Registered tools:",
    toolManager.getAll().map(t => t.name)
);

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
        } catch (e) {
            // Safely ignore parse errors
        }

        console.log("\n🔥 AI REQUEST:", req.method, req.url);
        console.log("BODY:", safeBody);
    }
    next();
});

// ----------------------
// AI Routes
// ----------------------
app.use("/ai", aiRoutes);
app.use("/day", dayRoutes);

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// TEMP SESSION STORE (DEV ONLY)
// const sessions = {};

app.get("/auth/logout/:sessionId", async (req, res) => {
    try {
        await sessionStore.delete(req.params.sessionId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

/**
 * START OAUTH
 */
app.get("/auth/github", (req, res) => {

    const prompt = req.query.prompt || "select_account";

    const url =
        "https://github.com/login/oauth/authorize" +
        `?client_id=${CLIENT_ID}` +
        "&scope=read:user repo" +
        `&prompt=${prompt}`;

    res.redirect(url);
});

/**
 * CALLBACK
 */
app.get("/auth/github/callback", async (req, res) => {

    console.log("========== GITHUB CALLBACK ==========");

    const code = req.query.code;

    if (!code) {
        console.log("❌ Missing code");
        return res.status(400).send("Missing code");
    }

    try {

        console.log("1️⃣ Exchanging code for token...");

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

        console.log("2️⃣ Token received");

        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            console.log("❌ No access token");
            return res.status(400).send("Token exchange failed");
        }

        console.log("3️⃣ Fetching GitHub user...");

        const userResponse = await axios.get(
            "https://api.github.com/user",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        console.log("✅ User:", userResponse.data.login);

        console.log("4️⃣ Fetching repositories...");

        const repoResponse = await axios.get(
            "https://api.github.com/user/repos?per_page=100",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        console.log("✅ Repo Count:", repoResponse.data.length);

        const sessionId = crypto.randomUUID();

        console.log("5️⃣ Session ID:", sessionId);

        console.log("6️⃣ Clearing old sessions...");

        await sessionStore.clearAllForUser(userResponse.data.login);

        console.log("✅ Old sessions cleared");

        console.log("7️⃣ Saving session...");

        await sessionStore.save(sessionId, {
            token: accessToken,
            user: userResponse.data,
            repos: repoResponse.data
        });

        console.log("✅ Session saved");

        const username = encodeURIComponent(userResponse.data.login);
        const avatar = encodeURIComponent(userResponse.data.avatar_url);

        console.log("8️⃣ Redirecting to Android...");

        res.redirect(
            `samvaad://callback?sessionId=${sessionId}` +
            `&username=${username}` +
            `&avatar=${avatar}`
        );

    } catch (err) {

        console.error("❌ CALLBACK FAILED");

        console.error(err);

        if (err.response) {
            console.error(err.response.status);
            console.error(err.response.data);
        }

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
try {
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL is working");
} catch (e) {
    console.error("❌ PostgreSQL connection failed");
    console.error(e);
}
/**
 * START SERVER
 */
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});