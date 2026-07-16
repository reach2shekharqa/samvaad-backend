import aiService from "../../agent/ai/AIService.js";


export async function localPlannerNode(state) {


    // -----------------------------
    // Evidence available
    // -----------------------------

    if (
        Array.isArray(state.evidence) &&
        state.evidence.length > 0
    ) {

        console.log(
            "✅ Evidence found, finishing"
        );


        return {

            ...state,

            action:"finish"

        };

    }



    // ------------------------------------
    // Day Query -> Hora Tool
    // ------------------------------------

    if (
        state.context?.intent === "day_query"
    ) {


        console.log(
            "🕒 Day query detected -> horaTool"
        );


        return {

            ...state,


            iteration:
                (state.iteration || 0) + 1,


            tools:[

                {

                    name:"horaTool",

                    input:{

                        latitude:
                            state.context.location.latitude,


                        longitude:
                            state.context.location.longitude

                    }

                }

            ],


            action:"tool"

        };

    }




    // -----------------------------
    // Safety
    // -----------------------------

    if(
        (state.iteration || 0) >= 3
    ){

        console.log(
            "⚠️ Max iteration reached"
        );


        return {

            ...state,

            action:"finish"

        };

    }




    console.log(
        "🤖 Asking LLM for tool decision"
    );



    const decision =
        await aiService.chat({

            systemPrompt:`

You are a local search planner.

Return ONLY JSON.

Available tool:

placesSearchTool


Category mapping:

hospital:
healthcare.hospital

clinic:
healthcare.clinic

pharmacy:
healthcare.pharmacy

restaurant:
catering.restaurant

cafe:
catering.cafe

atm:
service.financial.atm

bank:
service.financial.bank


Format:

{
 "tool":"placesSearchTool",
 "category":"category",
 "query":"query"
}

`,

            userPrompt:
                state.input,


            temperature:0

        });



    let parsed;


    try {

        parsed =
            typeof decision === "string"
            ? JSON.parse(decision)
            : decision;


    }
    catch {


        parsed={

            tool:"placesSearchTool",

            category:"healthcare.hospital",

            query:state.input

        };

    }



    console.log(
        "🤖 Planner Decision:",
        parsed
    );



    return {

        ...state,


        iteration:
            (state.iteration || 0)+1,


        tools:[

            {

                name:
                    parsed.tool,


                input:{

                    query:
                        parsed.query ||
                        state.input,


                    category:
                        parsed.category,


                    location:
                        state.context?.location

                }

            }

        ],


        action:"tool"

    };

}