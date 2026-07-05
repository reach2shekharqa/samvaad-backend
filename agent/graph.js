import { StateGraph } from "@langchain/langgraph";

import { plannerNode } from "./nodes/plannerNode.js";
import { ToolNode } from "./nodes/ToolNode.js";
import { responseNode } from "./nodes/responseNode.js";

import toolManager from "../tools/ToolManager.js";
import readReadmeTool from "../tools/readReadmeTool.js";

// Register tools once
toolManager.register(readReadmeTool);

// Create ToolNode
const toolNode = new ToolNode(toolManager);

export function buildSamvaadGraph() {

    const graph = new StateGraph({
        channels: {
            input: "string",
            plan: "object",
            toolResults: "array",
            response: "string",
            context: "object"
        }
    });

    graph.addNode("planner", plannerNode);
    graph.addNode("tool", async (state) => toolNode.execute(state));
    graph.addNode("response", responseNode);

    graph.setEntryPoint("planner");

    graph.addEdge("planner", "tool");
    graph.addEdge("tool", "response");

    graph.setFinishPoint("response");

    return graph.compile();
}