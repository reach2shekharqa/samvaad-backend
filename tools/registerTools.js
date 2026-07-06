import toolManager from "./ToolManager.js";

import readFileTool from "./readFileTool.js";

import discoverRepositoryTool from "./discoverRepositoryTool.js"

export function registerTools() {

    toolManager.register(readFileTool);
    toolManager.register(discoverRepositoryTool);


}

