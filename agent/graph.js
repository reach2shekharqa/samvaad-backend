import { StateGraph } from "@langchain/langgraph";
import { groqNode } from "./nodes/groqNode.js";

export function buildSamvaadGraph() {
  const graph = new StateGraph({
    channels: {
      input: "string",
      response: "string",
      context: "object"
    }
  });

  graph.addNode("groq", groqNode);

  graph.setEntryPoint("groq");
  graph.setFinishPoint("groq");

  return graph.compile();
}