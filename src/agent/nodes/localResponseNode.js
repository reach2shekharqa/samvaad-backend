export async function localResponseNode(state) {


    console.log(
        "📍 BUILDING LOCAL RESPONSE"
    );


    const places =
        state.evidence?.items || [];



    if(places.length === 0){

        return {

            finalResponse:
                "No nearby places found."

        };

    }



    const response = places
        .map(

            (place,index)=>{


                return (

`${index + 1}. ${place.name}

📍 ${place.address || "Address not available"}

📏 Distance: ${place.distance ?? "N/A"} km`
                );

            }

        )
        .join("\n\n--------------------\n\n");



    return {


        finalResponse:

            `Nearby places found:\n\n${response}`


    };

}