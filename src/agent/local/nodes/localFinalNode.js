export async function localFinalNode(state) {

  console.log("📝 LOCAL FINAL NODE");


  let response = state.finalResponse;


  const placesEvidence =
    (state.evidence || [])
      .find(
        item => item.source === "places"
      );


  console.log(
    "DEBUG PLACES EVIDENCE:",
    JSON.stringify(placesEvidence, null, 2)
  );


  if (
    !response &&
    placesEvidence?.data?.data &&
    Array.isArray(placesEvidence.data.data)
  ) {

    const places = placesEvidence.data.data;


    if (places.length > 0) {

      response =
        "I found these nearby places:\n\n" +
        places
          .slice(0, 5)
          .map(
            place =>
              `📍 ${place.name || "Unnamed place"} (${place.type || "place"})\nLocation: ${place.lat}, ${place.lon}`
          )
          .join("\n\n");

    }

  }


  if (!response) {

    response =
      "I could not find any nearby places for this search. Please share your location so I can search more accurately.";

  }


  return {

    ...state,

    finalResponse: response,

    action: "finish"

  };

}