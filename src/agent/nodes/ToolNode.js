import toolManager from "../tools/ToolManager.js";

export async function toolNode(state) {

    const tool = state.tools?.[0];

    if (!tool) {

        console.log("⚠️ No tool selected.");

        return {

            ...state,

            action: "final"

        };
    }

    console.log("\n==============================");
    console.log(`🔧 TOOL: ${tool.name}`);
    console.log("==============================");

    // Build GitHub context
    const github =
        state.github ||
        state.context?.github ||
        {};

    console.log("GitHub:");

    console.dir({

        owner: github.owner,

        repo: github.repo,

        token: github.token ? "***" : null

    });

    try {

        const input = {

            github,

            ...(tool.input || {}),

            context: state.context,

            input: state.input

        };

        const result =
            await toolManager.execute(

                tool.name,

                input

            );

        console.log(`✅ ${tool.name} completed`);

        const evidence = [

            ...(state.evidence || []),

            {

                tool: tool.name,

                input: tool.input || {},

                result

            }

        ];

        console.log(
            `📚 Evidence Count: ${evidence.length}`
        );

        return {

            ...state,

            evidence,

            tools: [],

            action: "planner"

        };

    }

    catch (err) {

        console.error(
            `❌ ${tool.name} failed`
        );

        console.error(err);

        return {

            ...state,

            evidence: [

                ...(state.evidence || []),

                {

                    tool: tool.name,

                    input: tool.input || {},

                    result: {

                        success: false,

                        error: err.message

                    }

                }

            ],

            tools: [],

            action: "final"

        };

    }

}