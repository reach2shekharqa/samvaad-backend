export async function routerNode(state) {

    const iteration =
        state.iteration || 0;


    console.log("================================");
console.log("🧭 ROUTER");
console.log("Iteration :", iteration);
console.log("Action    :", state.action);
console.log("================================");


    if (iteration >= 5) {

        return {

            ...state,

            action: "final",

            route: "final"

        };

    }


    switch (state.action) {

        case "tool":
        case "tool_completed":
            return {

                ...state,

                route: "tool"

            };


        case "finish":
        case "final":
            return {

                ...state,

                action: "final",

                route: "final"

            };


        default:
            return {

                ...state,

                action: "final",

                route: "final"

            };

    }

}