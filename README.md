# Samvaad Backend

Backend for a graph-based conversational agent platform (Samvaad).

Quick start

1. Copy .env.example to .env and set DATABASE_URL, GROQ credentials, and other secrets.
2. Install deps: npm install
3. Run in dev: npm run dev
4. Lint: npm run lint

Notes

- Uses langchain/langgraph for agent orchestration and custom developer tools in src/agent/tools.
- PostgreSQL pool is in src/db/db.js.
