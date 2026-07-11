
export async function localResponseNode(state) {

    console.log("📍 BUILDING LOCAL RESPONSE");

    const evidence = state.evidence || [];


    if (evidence.length === 0) {

        return {
            finalResponse: "No results found."
        };

    }



    // =====================================
    // HORA RESPONSE
    // =====================================

    const horaEvidence =
        evidence.find(
            e => e.tool === "horaTool"
        );


    if (horaEvidence) {


        if (!horaEvidence.result?.success) {


            return {

                finalResponse:
                    typeof horaEvidence.result.error === "string"

                        ? horaEvidence.result.error

                        : JSON.stringify(
                            horaEvidence.result.error,
                            null,
                            2
                        )

            };

        }



        const data =
            horaEvidence.result.data;



        // New Hora Tool Response
        // data.currentHora
        if (data?.currentHora) {


            const currentHora =
                data.currentHora;



            return {


                finalResponse:

`🕉 Current Hora

Planet : ${currentHora.planet} (${currentHora.vedicName})

Type : ${currentHora.type}

Day Hora : ${currentHora.isDay ? "Yes" : "No"}

Starts : ${currentHora.start}

Ends : ${currentHora.end}`


            };


        }



        return {

            finalResponse:
                "No current hora found."

        };


    }




    // =====================================
    // LOCAL EXPLORER RESPONSE
    // =====================================


    const placesEvidence =
        evidence.find(
            e => e.tool === "placesSearchTool"
        );


    if (placesEvidence) {


        if (!placesEvidence.result?.success) {


            return {

                finalResponse:
                    "Failed to fetch nearby places."

            };

        }



        const places =
            placesEvidence.result.data || [];



        if (places.length === 0) {


            return {

                finalResponse:
                    "No nearby places found."

            };

        }



        const response =
            places.map(
                (place, index) =>


`${index + 1}. ${place.name}

📍 ${place.address || "Address not available"}

📏 Distance: ${place.distance ?? "N/A"} km`


            )
            .join(
                "\n\n--------------------\n\n"
            );



        return {


            finalResponse:

`Nearby places found:

${response}`


        };


    }





    // =====================================
    // DEFAULT
    // =====================================


    return {

        finalResponse:
            "No results found."

    };

}

