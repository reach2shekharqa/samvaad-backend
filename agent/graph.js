import { StateGraph } from "@langchain/langgraph";

import { plannerNode } from "./nodes/plannerNode.js";
import { toolNode } from "./nodes/toolNode.js";
import { routerNode } from "./nodes/routerNode.js";
import { finalNode } from "./nodes/finalNode.js";

export function buildSamvaadGraph() {

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

  // ---------------- NODES ----------------
  graph.addNode("planner", plannerNode);
  graph.addNode("tool", toolNode);
  graph.addNode("router", routerNode);
  graph.addNode("final", finalNode);

  // 🔥 ENTRY FIX
  graph.setEntryPoint("planner");

  // normal flow
  graph.addEdge("planner", "router");
  graph.addEdge("tool", "router");

  // final exit
  graph.addEdge("final", "__end__");

  // routing decision
  graph.addConditionalEdges("router", (state) => {

  if ((state.iteration || 0) >= 2) {
    return "final";
  }

  if (state.action === "tool") {
    return "tool";
  }

  return "planner";
});

  // ---------------- EDGES ----------------
  // graph.addEdge("planner", "router");
  // graph.addEdge("tool", "router");
  // graph.addEdge("final", "__end__");

  return graph.compile();
}