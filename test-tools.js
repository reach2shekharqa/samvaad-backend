import toolManager from "./tools/ToolManager.js";
import { ToolNode } from "./agent/nodes/ToolNode.js";
import readReadmeTool from "./tools/readReadmeTool.js";
import responseAgent from "./agent/agents/ResponseAgent.js";

// register tool
toolManager.register(readReadmeTool);

// create node
const toolNode = new ToolNode(toolManager);

// state
let state = {
  input: "read repo readme and explain it",
  plan: {
    actions: [
      {
        toolName: "readReadmeTool",
        input: {
          repositoryPath: "D:/samvaad-backend"
        }
      }
    ]
  },
  toolResults: [],
  response: "",
  context: {
    repository: {
      name: "samvaad-backend",
      full_name: "samvaad/backend",
      language: "JavaScript",
      description: "AI agent backend system"
    }
  }
};

async function run() {

  // STEP 1: tools
  state = await toolNode.execute(state);

  // STEP 2: brain (THIS WAS MISSING)
  state.response = await responseAgent.generate(state);

  // FINAL OUTPUT
  console.log("\n===== FINAL RESPONSE =====\n");
  console.log(state.response);
}

run();