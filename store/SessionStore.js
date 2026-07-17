import pool from "../src/db/db.js";

class SessionStore {

    async save(sessionId, session) {

        console.log("========== SESSION SAVE ==========");
        console.log("Session ID:", sessionId);
        console.log("Username:", session?.user?.login);

        try {

            const result = await pool.query(
                `
                INSERT INTO sessions(session_id, username, session_data)
                VALUES ($1, $2, $3::jsonb)
                ON CONFLICT(session_id)
                DO UPDATE SET
                    username = EXCLUDED.username,
                    session_data = EXCLUDED.session_data
                RETURNING session_id;
                `,
                [
                    sessionId,
                    session.user.login,
                    JSON.stringify(session)
                ]
            );

            console.log("✅ Session saved successfully");
            console.log(result.rows);

        } catch (err) {

            console.error("❌ SAVE SESSION ERROR");
            console.error(err);

            throw err;
        }
    }

    async get(sessionId) {

        console.log("========== SESSION GET ==========");
        console.log("Session ID:", sessionId);

        try {

            const result = await pool.query(
                `
                SELECT session_data
                FROM sessions
                WHERE session_id = $1
                `,
                [sessionId]
            );

            console.log("Rows Found:", result.rowCount);

            if (result.rowCount === 0) {
                return null;
            }

            const data = result.rows[0].session_data;

            return typeof data === "string"
                ? JSON.parse(data)
                : data;

        } catch (err) {

            console.error("❌ GET SESSION ERROR");
            console.error(err);

            throw err;
        }
    }

    async delete(sessionId) {

        console.log("Deleting Session:", sessionId);

        await pool.query(
            `
            DELETE FROM sessions
            WHERE session_id=$1
            `,
            [sessionId]
        );

    }

    async clearAllForUser(username) {

        console.log("Clearing sessions for:", username);

        await pool.query(
            `
            DELETE FROM sessions
            WHERE username=$1
            `,
            [username]
        );

    }

    async getAll() {

        const result = await pool.query(
            `
            SELECT session_id, session_data
            FROM sessions
            `
        );

        const sessions = {};

        for (const row of result.rows) {

            sessions[row.session_id] =
                typeof row.session_data === "string"
                    ? JSON.parse(row.session_data)
                    : row.session_data;
        }

        return sessions;

    }

}

export default new SessionStore();