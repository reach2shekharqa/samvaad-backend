import { StateGraph } from "@langchain/langgraph";

import { plannerNode } from "./nodes/plannerNode.js";
import { toolNode } from "./nodes/ToolNode.js";
import { routerNode } from "./nodes/routerNode.js";
import { finalNode } from "./nodes/finalNode.js";

export function buildSamvaadGraph() {

    const graph = new StateGraph({
        channels: {
            input: "string",
            context: "object",

            iteration: "number",

            action: "string",

            tools: "array",

            evidence: "array",

            route: "string",

            finalResponse: "string"
        }
    });

    // ---------------- Nodes ----------------

    graph.addNode("planner", plannerNode);
    graph.addNode("tool", toolNode);
    graph.addNode("router", routerNode);
    graph.addNode("final", finalNode);

    // ---------------- Entry ----------------

    graph.setEntryPoint("planner");

    // ---------------- Flow ----------------

    // Planner decides what to do
    graph.addEdge("planner", "router");

    // Tool executes then comes back to planner
    graph.addEdge("tool", "planner");

    // Final ends the graph
    graph.addEdge("final", "__end__");

    // Router decides where to go
    graph.addConditionalEdges(
        "router",
        (state) => state.route,
        {
            tool: "tool",
            final: "final"
        }
    );

    return graph.compile();
}