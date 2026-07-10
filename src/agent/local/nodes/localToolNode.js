import { searchPlaces } from "../tools/placesTool.js";


export async function localToolNode(state) {

  console.log("🔧 LOCAL TOOL NODE");


  const toolRequest = state.context?.toolRequest;


  if (!toolRequest) {

    console.log("No tool request found");

    return {
      ...state,
      action: "finish"
    };

  }


  let result = null;


  try {

    result = await searchPlaces({
      query: toolRequest.query,
      location: toolRequest.location
    });


    console.log(
      "Places tool result:",
      result
    );


  } catch (error) {

    console.error(
      "Local tool error:",
      error
    );


    return {

      ...state,

      action: "finish",

      finalResponse:
        "Sorry, I was unable to find local information."

    };

  }


  return {

    ...state,

    evidence: [

      ...(state.evidence || []),

      {
        source: "places",
        data: result
      }

    ],


    action: "finish",


    iteration:
      (state.iteration || 0) + 1

  };

}