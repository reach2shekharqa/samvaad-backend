import discoverRepositoryTool
    from "../tools/developer/discoverRepositoryTool.js";

import readFileTool
    from "../tools/developer/readFileTool.js";

import placesSearchTool
    from "../tools/local/placesSearchTool.js";

import placesTool
    from "../tools/local/placesTool.js";

import horaTool
    from "../tools/day/horaTool.js";


const toolRegistry = {

    discoverRepositoryTool,

    readFileTool,

    placesSearchTool,

    placesTool,

    horaTool

};



export async function toolNode(state) {

    console.log(
        "🔧 TOOL NODE"
    );



    const selectedTool =
        state.tools?.[0];



    if (
        !selectedTool ||
        !selectedTool.name
    ) {

        console.log(
            "❌ No tool selected"
        );

        return {

            ...state,

            action: "finish"

        };

    }


    console.log({
        name: selectedTool.name
    });



    const tool =
        toolRegistry[selectedTool.name];



    if (!tool) {

        console.log(
            "❌ Tool not registered:",
            selectedTool.tool
        );

        return {

            ...state,

            action: "finish"

        };

    }



    try {

        console.log(
            "🚀 Executing:",
            tool.name
        );



        // All Samvaad tools use invoke(input, context)
        let result;


        if (typeof tool === "function") {

            result =
                await tool(
                    selectedTool.input,
                    state.context || {}
                );

        }
        else if (typeof tool.execute === "function") {

    result =
        await tool.execute(
            selectedTool.input,
            state.context || {}
        );

}
        else {

            throw new Error(
                "Invalid tool format"
            );

        }


        const evidence =
            state.evidence || [];



        evidence.push({

            tool:
                tool.name,

            result

        });



        return {

            ...state,

            evidence,

            plan: null,

            action: "planner"

        };

    }
    catch (error) {

        console.error(
            "❌ TOOL ERROR:",
            error.message
        );

        return {

            ...state,

            action: "finish"

        };

    }

}