import toolManager from "./tools/ToolManager.js";
import readReadmeTool from "./tools/readReadmeTool.js";

import { plannerNode } from "./agent/nodes/plannerNode.js";
import { ToolNode } from "./agent/nodes/ToolNode.js";
import responseAgent from "./agent/agents/ResponseAgent.js";

// Register tools
toolManager.register(readReadmeTool);

// Create ToolNode
const toolNode = new ToolNode(toolManager);

// Initial state
let state = {
    input: "Explain this repository",

    plan: null,

    toolResults: [],

    response: "",

    context: {
        repositoryPath: "D:/samvaad-backend",

        repository: {
            name: "samvaad-backend",
            full_name: "samvaad/backend",
            language: "JavaScript",
            description: "AI agent backend system"
        }
    }
};

async function run() {

    console.log("\n========== INITIAL STATE ==========\n");
    console.log(JSON.stringify(state, null, 2));

    // STEP 1 - Planner
    state = await plannerNode(state);

    console.log("\n========== PLAN ==========\n");
    console.log(JSON.stringify(state.plan, null, 2));

    // STEP 2 - Tool Execution
    state = await toolNode.execute(state);

    console.log("\n========== TOOL RESULTS ==========\n");
    console.log(JSON.stringify(state.toolResults, null, 2));

    // STEP 3 - Response Generation
    state.response = await responseAgent.generate(state);

    console.log("\n========== FINAL RESPONSE ==========\n");
    console.log(state.response);
}

run();