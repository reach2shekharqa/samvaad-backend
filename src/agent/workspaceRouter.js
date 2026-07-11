import { buildSamvaadGraph } from "./graph.js";


let developerGraph = null;


export function getWorkspaceGraph(workspace) {

    switch (workspace) {

        case "developer":

            if (!developerGraph) {
                console.log("🚀 Building Developer Graph");
                developerGraph = buildSamvaadGraph();
            }

            return developerGraph;


        case "local":
            throw new Error(
                `Workspace "local" is not configured. Missing local graph implementation.`
            );

        case "day":
            throw new Error(
                `Workspace "day" is not configured. Missing day graph implementation.`
            );


        default:

            throw new Error(
                `Unsupported workspace: ${workspace}`
            );
    }
}