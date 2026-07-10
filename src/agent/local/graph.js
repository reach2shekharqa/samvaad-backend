import { StateGraph } from "@langchain/langgraph";

import { localPlannerNode } from "./nodes/localPlannerNode.js";
import { localToolNode } from "./nodes/localToolNode.js";
import { localRouterNode } from "./nodes/localRouterNode.js";
import { localFinalNode } from "./nodes/localFinalNode.js";


export function buildLocalGraph() {

    const graph = new StateGraph({

        channels: {

            input: "string",

            context: "object",

            iteration: "number",

            action: "string",

            evidence: "array",

            finalResponse: "string"

        }

    });


    // Nodes

    graph.addNode(
        "planner",
        localPlannerNode
    );


    graph.addNode(
        "tool",
        localToolNode
    );


    graph.addNode(
        "router",
        localRouterNode
    );


    graph.addNode(
        "final",
        localFinalNode
    );


    // Entry

    graph.setEntryPoint(
        "planner"
    );


    // Normal flow

    graph.addEdge(
        "planner",
        "router"
    );


    graph.addEdge(
        "tool",
        "router"
    );


    // Final

    graph.addEdge(
        "final",
        "__end__"
    );


    // Router decision

    graph.addConditionalEdges(
        "router",
        (state) => {


            if ((state.iteration || 0) >= 2) {
                return "final";
            }


            if (state.action === "tool") {
                return "tool";
            }


            return "planner";

        }
    );


    return graph.compile();

}