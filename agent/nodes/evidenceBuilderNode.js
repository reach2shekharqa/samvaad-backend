export async function evidenceBuilderNode(state) {

  if (!state.toolResults || !state.plan) {
    return state;
  }

  // -----------------------------
  // SAFE INIT (CRITICAL FIX)
  // -----------------------------
  if (!state.evidence) {
    state.evidence = {};
  }

  if (!Array.isArray(state.evidence.items)) {
    state.evidence.items = [];
  }

  if (!state.evidence.summary) {
    state.evidence.summary = null;
  }

  const items = state.evidence.items;

  switch (state.plan.tool) {

    case "discoverRepositoryTool":
      items.push({
        type: "repo",
        tree: state.toolResults?.tree || []
      });
      break;

    case "readFileTool":
      items.push({
        type: "file",
        filePath: state.plan.input?.filePath,
        content: state.toolResults?.content || "",
        success: state.toolResults?.success
      });
      break;

    default:
      items.push({
        type: "tool",
        tool: state.plan.tool,
        result: state.toolResults
      });
  }

  return {
    ...state,

    evidence: {
      ...state.evidence,
      items
    },

    toolResults: {}
  };
}