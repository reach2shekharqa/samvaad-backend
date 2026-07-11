export async function routerNode(state) {

    // Router should NOT increment iteration.
    // Only Planner controls iteration.
    const iteration =
        state.iteration || 0;

    console.log(
        `🧭 Router | Iteration: ${iteration} | Action: ${state.action}`
    );

    if (iteration >= 5) {

        console.log(
            "🛑 Max iterations reached."
        );

        return {

            ...state,

            iteration,

            action: "final",

            route: "final"

        };

    }

    switch (state.action) {

        case "tool":

            return {

                ...state,

                iteration,

                action: "tool",

                route: "tool"

            };

        case "planner":

            return {

                ...state,

                iteration,

                action: "planner",

                route: "planner"

            };

        case "finish":

        case "final":

            return {

                ...state,

                iteration,

                action: "final",

                route: "final"

            };

        default:

            console.log(
                `⚠️ Unknown action '${state.action}', switching to final.`
            );

            return {

                ...state,

                iteration,

                action: "final",

                route: "final"

            };

    }

}