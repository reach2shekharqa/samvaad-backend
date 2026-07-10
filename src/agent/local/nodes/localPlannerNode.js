
export async function localPlannerNode(state) {

  console.log("🧠 LOCAL PLANNER NODE");

  const input = state.input || "";

  console.log("User input:", input);
  console.log(
    "DEBUG LOCAL CONTEXT:",
    JSON.stringify(state.context, null, 2)
  );


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
    question.includes("place") ||
    question.includes("parking") ||
    question.includes("hospital") ||
    question.includes("pharmacy") ||
    question.includes("shop") ||
    question.includes("hotel") ||
    state.intent === "place_search"
  ) {

    console.log("📍 Local planner selected places tool");


    const toolRequest = {

      query: input,

      location:
        state.context?.location || null

    };
    console.log(
      "DEBUG TOOL REQUEST:",
      JSON.stringify(toolRequest, null, 2)
    );

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