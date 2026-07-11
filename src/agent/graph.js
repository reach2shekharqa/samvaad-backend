import { StateGraph } from "@langchain/langgraph";

import { plannerNode } 
from "./nodes/plannerNode.js";

import { toolNode } 
from "./nodes/ToolNode.js";

import { routerNode } 
from "./nodes/routerNode.js";

import { finalNode } 
from "./nodes/finalNode.js";


export function buildSamvaadGraph() {


    const graph = new StateGraph({

        channels: {

            input: "string",

            context: "object",


            iteration: "number",


            action: "string",


            // ✅ ADD THIS
            plan: "object",


            tools: "array",


            evidence: "array",


            toolResults: "object",


            route: "string",


            finalResponse: "string"

        }

    });



    // Nodes

    graph.addNode(
        "planner",
        plannerNode
    );


    graph.addNode(
        "tool",
        toolNode
    );


    graph.addNode(
        "router",
        routerNode
    );


    graph.addNode(
        "final",
        finalNode
    );



    graph.setEntryPoint(
        "planner"
    );



    graph.addEdge(
        "planner",
        "router"
    );



    graph.addEdge(
        "tool",
        "planner"
    );



    graph.addEdge(
        "final",
        "__end__"
    );



    graph.addConditionalEdges(

        "router",

        (state)=>{

            return state.route;

        },

        {

            tool:"tool",

            final:"final"

        }

    );



    return graph.compile();

}