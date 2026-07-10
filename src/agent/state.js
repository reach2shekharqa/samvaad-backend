export const createInitialState = (input, context = {}) => ({
    input,

    plan: null,

    toolResults: [],

    response: "",

    context: {
        sessionId: context.sessionId || "",
        githubToken: context.githubToken || "",
        user: context.user || null,
        repository: context.repository || null,

        // NEW
        repositoryPath: context.repositoryPath || ""
    }
});