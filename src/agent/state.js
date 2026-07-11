export const createInitialState = (input, context = {}) => ({
    input,

    context: {
        sessionId: context.sessionId || "",
        githubToken: context.githubToken || "",
        user: context.user || null,
        repository: context.repository || null,
        repositoryPath: context.repositoryPath || ""
    },

    iteration: 0,

    action: "tool",

    tools: [],

    evidence: [],

    route: "",

    finalResponse: ""
});