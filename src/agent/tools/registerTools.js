import readFileTool from "./developer/readFileTool.js";
import discoverRepositoryTool from "./developer/discoverRepositoryTool.js";

import placesSearchTool from "./local/placesSearchTool.js";
import  placesTool  from "./local/placesTool.js";

import horaTool from "./day/horaTool.js";


export function registerTools() {

    console.log("🔧 Registering tools...");


    const tools = [

        readFileTool,

        discoverRepositoryTool,

        placesSearchTool,

        placesTool,

        horaTool

    ];


    console.log(
        "Registered tools:",
        tools.map(t => t.name)
    );


    return tools;
}