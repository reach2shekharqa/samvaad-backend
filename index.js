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