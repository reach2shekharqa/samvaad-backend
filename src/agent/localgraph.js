import { StateGraph } from "@langchain/langgraph";

import { localPlannerNode }
    from "./nodes/localPlannerNode.js";

import { toolNode } 
    from "./nodes/ToolNode.js";

import { routerNode } 
    from "./nodes/routerNode.js";

import { localResponseNode } 
    from "./nodes/localResponseNode.js";


export function buildLocalGraph() {


    const graph = new StateGraph({

        channels: {

            input: {},

            context: {},

            action: {},

            plan: {},
            
            route:{},

            tools: {},

            evidence: {},

            toolResults: {},

            iteration: {},

            finalResponse: {}

        }

    });



    graph.addNode(
        "planner",
        localPlannerNode
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
        localResponseNode
    );



    graph.setEntryPoint(
        "planner"
    );



    graph.addEdge(
        "planner",
        "router"
    );



    graph.addConditionalEdges(

        "router",

        (state)=>{


            if(state.route==="tool")
                return "tool";


            if(state.route==="final")
                return "final";


            return "final";

        },


        {

            tool:"tool",

            final:"final"

        }

    );



    graph.addEdge(
        "tool",
        "planner"
    );



    graph.addEdge(
        "final",
        "__end__"
    );



    return graph.compile();

}