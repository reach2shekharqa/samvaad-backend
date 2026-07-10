import toolManager from "./src/agent/tools/ToolManager.js";
import { readFileTool } from "./src/agent/tools/readFileTool.js";

import { plannerNode } from "./src/agent/nodes/plannerNode.js";
import { ToolNode } from "./src/agent/nodes/ToolNode.js";
import responseAgent from "./src/agent/agents/ResponseAgent.js";

toolManager.register(readFileTool);

const toolNode = new ToolNode(toolManager);

const repo = {
    owner: "reach2shekharqa",
    repo: "js_ts_concepts",
    fullName: "reach2shekharqa/js_ts_concepts"
};

let state = {
    input: "Explain this repository",

    plan: null,
    toolResults: [],
    response: "",

    context: {
        githubToken: process.env.GITHUB_TEST_TOKEN,
        repository: repo
    }
};

async function run() {

    state = await plannerNode(state);
    state = await toolNode.execute(state);
    state.response = await responseAgent.generate(state);

    console.log(state.response);
}

run();