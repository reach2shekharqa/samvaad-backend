import { buildSamvaadGraph } from "./graph.js";
import { buildLocalGraph } from "./local/graph.js";


let developerGraph = null;
let localGraph = null;


export function getWorkspaceGraph(workspace) {

    switch (workspace) {

        case "developer":

            if (!developerGraph) {
                console.log("🚀 Building Developer Graph");
                developerGraph = buildSamvaadGraph();
            }

            return developerGraph;


        case "local":

            if (!localGraph) {
                console.log("🚀 Building Local Graph");
                localGraph = buildLocalGraph();
            }

            return localGraph;


        default:

            throw new Error(
                `Unsupported workspace: ${workspace}`
            );
    }
}