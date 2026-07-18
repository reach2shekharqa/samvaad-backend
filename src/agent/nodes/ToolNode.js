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


    console.log(
        "STATE PLAN:",
        JSON.stringify(state.plan, null, 2)
    );


    console.log(
        "STATE TOOLS:",
        JSON.stringify(state.tools, null, 2)
    );



    // --------------------------------
    // Support both architectures
    // Developer:
    // state.tools[0]
    //
    // Local/Day:
    // state.plan
    // --------------------------------

    const selectedTool =
        state.tools?.[0]
        ||
        (
            state.plan
                ? {
                    name:
                        state.plan.tool,

                    input:
                        state.plan.input
                }
                : null
        );




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




    console.log(
        "📋 SELECTED TOOL:",
        JSON.stringify(
            selectedTool,
            null,
            2
        )
    );




    const tool =
        toolRegistry[selectedTool.name];




    if (!tool) {


        console.log(
            "❌ Tool not registered:",
            selectedTool.name
        );


        return {

            ...state,

            action: "finish"

        };

    }




    try {


        const safeInput = {

            ...(selectedTool.input || {}),

            github: selectedTool.input?.github
                ? {
                    owner: selectedTool.input.github.owner,
                    repo: selectedTool.input.github.repo,
                    token: "***"
                }
                : undefined

        };

        console.log("🚀 Executing Tool:", tool.name);
        console.log("📥 Tool Input:", JSON.stringify(safeInput, null, 2));



        let result;

        console.log("📤 Tool Result:");

        console.log(
            JSON.stringify(
                result,
                null,
                2
            )
        );

        console.log("--------------------------------");

        // Function style tool

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
        else if (typeof tool.invoke === "function") {


            result =
                await tool.invoke(
                    selectedTool.input,
                    state.context || {}
                );


        }
        else {


            console.log(
                "INVALID TOOL OBJECT:",
                tool
            );


            throw new Error(
                "Invalid tool format"
            );


        }




        const evidence =
            Array.isArray(state.evidence)
                ? [
                    ...state.evidence,
                    {
                        tool:
                            tool.name,

                        result
                    }
                ]
                : [
                    {
                        tool:
                            tool.name,

                        result
                    }
                ];





        return {


            ...state,


            evidence,


            // clear previous execution

            plan: null,


            tools: [],


            toolResults: {

                tool: tool.name,

                success: result?.success,

                data: result?.data,

                error: result?.error

            },


            action: "tool_completed"


        };



    }
    catch (error) {


        console.error("❌ TOOL ERROR");
        console.error(error);



        return {

            ...state,

            action: "finish"

        };


    }


}