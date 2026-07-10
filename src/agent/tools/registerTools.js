import toolManager from "./ToolManager.js";

import {readFileTool} from "./readFileTool.js";

import { discoverRepositoryTool } from "./discoverRepositoryTool.js";

import { localTools } from "../local/tools/index.js";


export function registerTools() {

    toolManager.register(readFileTool);

    toolManager.register(discoverRepositoryTool);

    for (const tool of localTools) {
        toolManager.register(tool);
    }

}