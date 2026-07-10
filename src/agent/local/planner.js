import { searchPlaces } from "./tools/placesTool.js";


export async function localPlanner(state) {

    const question = state.question.toLowerCase();

    console.log("🧠 LOCAL PLANNER");
    console.log("Question:", question);


    // Decide tool usage

    if (
        question.includes("restaurant") ||
        question.includes("food") ||
        question.includes("eat") ||
        question.includes("place")
    ) {

        const result = await searchPlaces({
            query: question,
            location: "current location"
        });


        return {
            ...state,

            evidence: [
                ...(state.evidence || []),
                {
                    source: "places",
                    data: result
                }
            ],

            action: "finish"
        };

    }


    // No tool required

    return {
        ...state,

        response:
            "I can help you find restaurants, places, and local information.",

        action: "finish"
    };
}