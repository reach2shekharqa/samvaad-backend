import { registerTools } from "./registerTools.js";


class ToolManager {

    constructor() {

        this.tools = new Map();

    }


    register(tool) {

        this.tools.set(
            tool.name,
            tool
        );

    }


    get(name) {

        return this.tools.get(name);

    }


    getAll() {

        return [
            ...this.tools.values()
        ];

    }


    async execute(name, input, context) {

        const tool = this.tools.get(name);


        if (!tool) {

            throw new Error(
                `Tool '${name}' not found.`
            );

        }


        if (typeof tool.execute !== "function") {

            throw new Error(
                `Tool '${name}' does not support execute()`
            );

        }


        try {

            return await tool.execute(
                input,
                context
            );

        }

        catch(err) {

            throw new Error(
                `Tool '${name} failed: ${err.message}`
            );

        }

    }

}



const toolManager = new ToolManager();


// Register all tools once
const tools = registerTools();


tools.forEach(tool => {

    toolManager.register(tool);

});


console.log(
    "ToolManager Loaded:",
    toolManager.getAll().map(t => t.name)
);


export default toolManager;