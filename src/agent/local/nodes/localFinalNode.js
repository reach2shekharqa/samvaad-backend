export async function localFinalNode(state) {

  console.log("📝 LOCAL FINAL NODE");


  let response = state.finalResponse;


  const placesEvidence =
    (state.evidence || [])
      .find(
        item => item.source === "places"
      );


  if (
    !response &&
    placesEvidence?.data?.places
  ) {

    const places =
      placesEvidence.data.places;


    response =
      "I found these places for you:\n\n" +
      places
        .map(
          place =>
            `${place.name} - ${place.rating}⭐ (${place.distance})`
        )
        .join("\n");

  }


  if (!response) {

    response =
      "I can help you with local places, restaurants, and nearby information.";

  }


  return {

    ...state,

    finalResponse: response,

    action: "finish"

  };

}