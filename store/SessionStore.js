import pool from "../src/db/db.js";

class SessionStore {

    async save(sessionId, session) {

        await pool.query(
            `
            INSERT INTO sessions(session_id, username, session_data)
            VALUES ($1,$2,$3)
            ON CONFLICT(session_id)
            DO UPDATE SET
                username = EXCLUDED.username,
                session_data = EXCLUDED.session_data
            `,
            [
                sessionId,
                session.user.login,
                JSON.stringify(session)
            ]
        );

    }

    async get(sessionId) {

        const result = await pool.query(
            "SELECT session_data FROM sessions WHERE session_id=$1",
            [sessionId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return JSON.parse(result.rows[0].session_data);

    }

    async delete(sessionId) {

        await pool.query(
            "DELETE FROM sessions WHERE session_id=$1",
            [sessionId]
        );

    }

    async clearAllForUser(username) {

        await pool.query(
            "DELETE FROM sessions WHERE username=$1",
            [username]
        );

    }

    async getAll() {

        const result = await pool.query(
            "SELECT session_id, session_data FROM sessions"
        );

        const sessions = {};

        result.rows.forEach(row => {
            sessions[row.session_id] = JSON.parse(row.session_data);
        });

        return sessions;

    }

}

export default new SessionStore();