import discoverRepositoryTool
    from "../tools/developer/discoverRepositoryTool.js";

import readFileTool
    from "../tools/developer/readFileTool.js";


const toolRegistry = {

    discoverRepositoryTool,

    readFileTool

};



export async function toolNode(state) {


    console.log(
        "🔧 TOOL NODE"
    );



    const tools =
        state.tools || [];



    if (tools.length === 0) {


        console.log(
            "❌ No tool selected"
        );


        return {

            ...state,

            action: "finish"

        };

    }




    const selectedTool =
        tools[0];



    console.log(
        "📋 SELECTED TOOL:",
        JSON.stringify(selectedTool, null, 2)
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


        console.log(
            "🚀 Executing:",
            tool.name
        );



        const result =
            await tool.execute(

                {
                    ...selectedTool.input,

                    github:
                        state.context?.github
                }

            );



        console.log(
            "📦 Tool output:",
            JSON.stringify(result, null, 2)
        );




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


            tools: [],


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


            action: "final"

        };


    }


}