import toolManager from "./ToolManager.js";

import readReadmeTool from "./readReadmeTool.js";

export function registerTools() {

    toolManager.register(readReadmeTool);

    console.log("✅ Registered Tools:");

    toolManager.getAll().forEach(tool => {
        console.log(`   • ${tool.name}`);
    });

}