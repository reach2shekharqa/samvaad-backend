export async function routerNode(state) {

    const iteration =
        state.iteration || 0;


    console.log(
        `🧭 Router | Iteration: ${iteration} | Action: ${state.action}`
    );


    if(iteration >= 5){

        return {

            ...state,

            action:"final",

            route:"final"

        };

    }


    switch(state.action){

        case "tool":

            return {

                ...state,

                route:"tool"

            };


        case "finish":

        case "final":

            return {

                ...state,

                action:"final",

                route:"final"

            };


        default:

            return {

                ...state,

                action:"final",

                route:"final"

            };

    }

}