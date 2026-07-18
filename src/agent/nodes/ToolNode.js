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

    console.log("================================");
    console.log("🔧 TOOL NODE");
    console.log("================================");

    console.log(
        "STATE PLAN:",
        JSON.stringify(
            state.plan,
            null,
            2
        )
    );

    console.log(
        "STATE TOOLS:",
        JSON.stringify(
            state.tools,
            null,
            2
        )
    );

    //-----------------------------------------
    // Developer
    //-----------------------------------------

    let selectedTool =
        state.tools?.[0];

    //-----------------------------------------
    // Local / Day
    //-----------------------------------------

    if (
        !selectedTool &&
        state.plan?.tool
    ) {

        selectedTool = {

            name:
                state.plan.tool,

            input:
                state.plan.input || {}

        };

    }

    if (
        !selectedTool
    ) {

        console.log(
            "❌ No tool selected."
        );

        return {

            ...state,

            action: "finish"

        };

    }

    console.log(
        "📋 SELECTED TOOL:"
    );

    console.log(

        JSON.stringify(

            selectedTool,

            null,

            2

        )

    );

    const tool =
        toolRegistry[
            selectedTool.name
        ];

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

            github:
                selectedTool.input?.github
                    ? {

                        owner:
                            selectedTool.input.github.owner,

                        repo:
                            selectedTool.input.github.repo,

                        token:
                            "***"

                    }
                    : undefined

        };

        console.log(
            "🚀 Executing Tool:",
            tool.name
        );

        console.log(
            "📥 Tool Input:"
        );

        console.log(

            JSON.stringify(

                safeInput,

                null,

                2

            )

        );

        let result;        //-----------------------------------------
        // Execute Tool
        //-----------------------------------------

        if (typeof tool === "function") {

            result =
                await tool(
                    selectedTool.input,
                    state.context || {}
                );

        }
        else if (
            typeof tool.execute === "function"
        ) {

            result =
                await tool.execute(
                    selectedTool.input,
                    state.context || {}
                );

        }
        else if (
            typeof tool.invoke === "function"
        ) {

            result =
                await tool.invoke(
                    selectedTool.input,
                    state.context || {}
                );

        }
        else {

            throw new Error(
                "Invalid tool implementation."
            );

        }

        //-----------------------------------------
        // Log Result
        //-----------------------------------------

        console.log(
            "📤 Tool Result:"
        );

        console.log(

            JSON.stringify(

                result,

                null,

                2

            )

        );

        console.log(
            "--------------------------------"
        );

        //-----------------------------------------
        // Save Evidence
        //-----------------------------------------

        const evidence =

            Array.isArray(state.evidence)

                ? [

                    ...state.evidence,

                    {

                        tool:
                            selectedTool.name,

                        result

                    }

                ]

                : [

                    {

                        tool:
                            selectedTool.name,

                        result

                    }

                ];

        //-----------------------------------------
        // Return
        //-----------------------------------------

        return {

            ...state,

            evidence,

            toolResults: {

                tool:
                    selectedTool.name,

                success:
                    result?.success,

                data:
                    result?.data,

                error:
                    result?.error

            },

            plan: null,

            tools: [],

            action: "tool"

        };

    }
    catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "❌ TOOL ERROR"
        );

        console.error(error);

        console.error(
            "================================"
        );

        return {

            ...state,

            evidence: [

                ...(state.evidence || []),

                {

                    tool:
                        selectedTool?.name || "unknown",

                    result: {

                        success: false,

                        error:
                            error.message

                    }

                }

            ],

            action: "final"

        };

    }

}