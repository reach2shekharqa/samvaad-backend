import plannerAgent from "../agents/PlannerAgent.js";

export async function plannerNode(state) {

    const rawPlan = await plannerAgent.plan(
        state.input,
        state.context
    );

    const actions = (rawPlan.tools || []).map(tool => {

        let input = {
            ...(tool.input || {})
        };

        switch (tool.name) {

            case "readReadmeTool":
                input.repositoryPath = state.context.repositoryPath;
                break;

            // Future tools
            // case "searchCodeTool":
            //     input.repositoryPath = state.context.repositoryPath;
            //     break;

            default:
                break;
        }

        return {
            toolName: tool.name,
            input
        };
    });

    return {
        ...state,
        plan: {
            actions
        }
    };
}