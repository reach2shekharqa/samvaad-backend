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


    async execute(name, input = {}, context = {}) {


        const tool = this.tools.get(name);


        if (!tool) {

            throw new Error(
                `Tool '${name}' not found.`
            );

        }


        try {


            // New standard
            if (typeof tool.invoke === "function") {


                return await tool.invoke(

                    input,

                    context

                );

            }



            // Backward compatibility
            if (typeof tool.execute === "function") {


                return await tool.execute(

                    input,

                    context

                );

            }



            throw new Error(

                `Tool '${name}' has no invoke() or execute() method`

            );


        }

        catch(err) {


            throw new Error(

                `Tool '${name}' failed: ${err.message}`

            );

        }

    }

}



const toolManager = new ToolManager();



const tools = registerTools();



tools.forEach(tool => {

    toolManager.register(tool);

});



console.log(

    "ToolManager Loaded:",

    toolManager
        .getAll()
        .map(t => t.name)

);



export default toolManager;