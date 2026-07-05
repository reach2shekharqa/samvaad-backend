export class ToolNode {
  constructor(toolManager) {
    this.toolManager = toolManager;
  }

  async execute(state) {
    const plan = state.plan;

    if (!plan || !plan.actions || plan.actions.length === 0) {
      return {
        ...state,
        toolResults: []
      };
    }

    const results = [];

    for (const action of plan.actions) {
      const { toolName, input } = action;

      try {
        // ✅ ALL execution delegated to ToolManager
        const output = await this.toolManager.execute(toolName, input);

        results.push({
          toolName,
          input,
          output,
          success: true
        });

      } catch (err) {
        results.push({
          toolName,
          input,
          success: false,
          error: err?.message || "Tool execution failed"
        });
      }
    }

    return {
      ...state,
      toolResults: results
    };
  }
}