import plannerAgent from "../agents/PlannerAgent.js";

export async function plannerNode(state) {

    const plan = await plannerAgent.plan(state.input);

    return {
        ...state,
        plan
    };

}