import fs from "fs/promises";
import path from "path";

const SESSION_FILE = path.join(process.cwd(), "store", "sessions.json");

class SessionStore {

    async load() {

        try {

            const data = await fs.readFile(SESSION_FILE, "utf8");

            return JSON.parse(data);

        } catch {

            return {};

        }

    }

    async saveAll(sessions) {

        await fs.writeFile(
            SESSION_FILE,
            JSON.stringify(sessions, null, 2),
            "utf8"
        );

    }

    async save(sessionId, session) {

        const sessions = await this.load();

        sessions[sessionId] = session;

        await this.saveAll(sessions);

    }

    async get(sessionId) {

        const sessions = await this.load();

        return sessions[sessionId] || null;

    }

    async delete(sessionId) {

        const sessions = await this.load();

        delete sessions[sessionId];

        await this.saveAll(sessions);

    }

    async getAll() {

        return await this.load();

    }

}

export default new SessionStore();