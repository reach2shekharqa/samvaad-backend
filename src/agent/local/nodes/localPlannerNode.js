import { searchPlaces } from "../tools/placesTool.js";


export async function localPlannerNode(state) {

  console.log("🧠 LOCAL PLANNER NODE");

  const input = state.input || "";

  console.log("User input:", input);


  let action = "finish";
  let evidence = state.evidence || [];


  const question = input.toLowerCase();


  /*
      Simple planner decision.

      Later this will become LLM planner
      exactly like developer plannerNode.
  */


  if (
    question.includes("restaurant") ||
    question.includes("food") ||
    question.includes("eat") ||
    question.includes("place")
  ) {

    console.log("📍 Local planner selected places tool");


    const toolRequest = {
      query: input,
      location: state.context?.location || "current location"
    };


    return {

      ...state,

      action: "tool",

      context: {
        ...state.context,
        toolRequest
      },

      iteration: (state.iteration || 0) + 1,

      evidence

    };

  }


  return {

    ...state,

    action: "finish",

    finalResponse:
      "I can help you find nearby places, restaurants, and local information.",

    iteration: (state.iteration || 0) + 1

  };

}