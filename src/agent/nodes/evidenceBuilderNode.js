export async function evidenceBuilderNode(state) {

    if (!state.toolResults || !state.plan) {
        return state;
    }


    // -----------------------------
    // SAFE INIT
    // -----------------------------

    if (!state.evidence) {
        state.evidence = {
            items: [],
            summary: null
        };
    }


    if (!Array.isArray(state.evidence.items)) {
        state.evidence.items = [];
    }


    const items = [
        ...state.evidence.items
    ];



    switch (state.plan.tool) {


        case "discoverRepositoryTool":


            items.push({

                type: "repo",

                totalFiles:
                    state.toolResults?.data?.totalFiles || 0,


                totalDirectories:
                    state.toolResults?.data?.totalDirectories || 0,


                recommendedFiles:
                    state.toolResults?.data?.recommendedFiles || [],


                repositoryInfo:
                    state.toolResults?.data?.repositoryInfo || {}

            });


            break;



        case "readFileTool":


            const content =
                state.toolResults?.data?.content || "";


            items.push({

                type: "file",

                filePath:
                    state.plan.input?.filePath,


                contentLength:
                    content.length,


                // keep only useful context
                content:
                    content.substring(0,2000),


                success:
                    state.toolResults?.success

            });


            break;



        default:


            items.push({

                type:"tool",

                tool:
                    state.plan.tool,


                result:
                    state.toolResults

            });

    }



    return {

        ...state,


        evidence: {

            ...state.evidence,

            items

        },


        // clear old tool result
        toolResults:{}

    };

}