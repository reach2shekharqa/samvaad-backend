import axios from "axios";



function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {


    const R = 6371;


    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;


    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;



    const a =

        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(lat1 * Math.PI / 180)
        *
        Math.cos(lat2 * Math.PI / 180)
        *
        Math.sin(dLon / 2)
        *
        Math.sin(dLon / 2);



    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );



    return R * c;

}





async function searchPlaces({
    category,
    query,
    lat,
    lon
}) {


    try {


        console.log(
            "📍 Geoapify category:",
            category
        );



        const response =
            await axios.get(


                "https://api.geoapify.com/v2/places",


                {

                    params:{


                        categories:
                            category,


                        filter:
                            `circle:${lon},${lat},5000`,


                        limit:5,


                        apiKey:
                            process.env.GEOAPIFY_KEY


                    }


                }


            );





        const places =

            response.data.features.map(


                place => {


                    const properties =
                        place.properties;



                    const placeLat =
                        properties.lat;



                    const placeLon =
                        properties.lon;



                    const distance =

                        calculateDistance(

                            lat,

                            lon,

                            placeLat,

                            placeLon

                        );





                    return {


                        name:

                            properties.name
                            ||
                            properties.brand
                            ||
                            properties.operator
                            ||
                            "Unknown",



                        address:

                            properties.formatted
                            ||
                            "",



                        phone:

                            properties.phone
                            ||
                            null,



                        website:

                            properties.website
                            ||
                            null,



                        email:

                            properties.email
                            ||
                            null,



                        openingHours:

                            properties.opening_hours
                            ||
                            null,



                        placeId:

                            properties.place_id
                            ||
                            null,



                        lat:

                            placeLat,



                        lon:

                            placeLon,



                        distance:

                            Number(
                                distance.toFixed(2)
                            )


                    };


                }


            );





        places.sort(

            (a,b)=>
                a.distance - b.distance

        );





        return {


            success:true,


            data:places


        };



    }

    catch(error){


        console.error(
            "Geoapify Error:",
            error.message
        );



        return {


            success:false,


            error:
                error.message


        };


    }


}







export default {


    name:"placesSearchTool",



    description:

        "Search nearby places based on user location",





    invoke:

        async function(input, context){



            return await searchPlaces({



                query:

                    input.query,



                category:

                    input.category
                    ||
                    "healthcare.hospital",



                lat:

                    context.location.latitude,



                lon:

                    context.location.longitude



            });



        }


};