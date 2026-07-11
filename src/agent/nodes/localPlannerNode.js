import aiService from "../../agent/ai/AIService.js";


export async function localPlannerNode(state) {


    console.log(
        "🧠 LOCAL PLANNER"
    );



    // -----------------------------
    // Evidence available
    // -----------------------------

    if (
        state.evidence?.items &&
        state.evidence.items.length > 0
    ) {

        console.log(
            "✅ Evidence found, finishing"
        );


        return {

            action:"finish"

        };

    }




    // -----------------------------
    // Safety limit
    // -----------------------------

    if(
        state.iteration >= 3
    ){

        console.log(
            "⚠️ Max iteration reached"
        );


        return {

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

Your job is to select the correct category for nearby place search.

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

coffee:
catering.cafe

atm:
service.financial.atm

bank:
service.financial.bank


JSON format:

{
 "tool":"placesSearchTool",
 "category":"category",
 "query":"search query"
}

`,


            userPrompt:

`
User request:

${state.input}
`,

            temperature:0


        });





    let parsed;



    try {


        parsed =
            typeof decision === "string"

            ?
            JSON.parse(
                decision
            )

            :
            decision;


    }
    catch(error){


        console.log(
            "⚠️ LLM JSON parse failed"
        );


        parsed={

            tool:"placesSearchTool",

            category:
            "healthcare.hospital",

            query:
            state.input

        };

    }





    console.log(
        "🤖 Planner Decision:",
        parsed
    );





    return {


        iteration:
            (state.iteration || 0)+1,



        plan:{


            tool:
                parsed.tool,



            input:{


                query:
                    parsed.query
                    ||
                    state.input,



                category:
                    parsed.category,



                location:
                    state.context?.location


            }


        },



        action:"tool"


    };


}