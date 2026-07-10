import axios from "axios";


function resolveCategory(query) {

    const q = (query || "").toLowerCase();


    if (
        q.includes("parking") ||
        q.includes("park car") ||
        q.includes("car park")
    ) {
        return "parking";
    }


    if (
        q.includes("restaurant") ||
        q.includes("food") ||
        q.includes("eat") ||
        q.includes("dinner") ||
        q.includes("lunch")
    ) {
        return "catering.restaurant";
    }


    if (
        q.includes("hospital") ||
        q.includes("clinic")
    ) {
        return "healthcare.hospital";
    }


    if (
        q.includes("pharmacy") ||
        q.includes("medicine") ||
        q.includes("medical")
    ) {
        return "healthcare.pharmacy";
    }


    if (
        q.includes("cafe") ||
        q.includes("coffee")
    ) {
        return "catering.cafe";
    }


    if (
        q.includes("hotel")
    ) {
        return "accommodation.hotel";
    }


    return "commercial";
}



export async function searchPlaces({
    query,
    lat,
    lon
}) {


    // fallback only when coordinates are missing
    if (!lat || !lon) {

        console.log(
            "⚠️ Using fallback location"
        );

        lat = 28.6139;
        lon = 77.2090;

    } else {

        console.log(
            "📍 Using provided location:",
            lat,
            lon
        );

    }


    try {

        const category = resolveCategory(query);


        console.log(
            "Geoapify category:",
            category
        );


        const radius = 5000;


        const url =
            `https://api.geoapify.com/v2/places` +
            `?categories=${category}` +
            `&filter=circle:${lon},${lat},${radius}` +
            `&limit=10` +
            `&apiKey=${process.env.GEOAPIFY_KEY}`;



        const response = await axios.get(
            url,
            {
                timeout: 15000
            }
        );


        const features =
            response.data.features || [];



        const places =
            features.map(item => {

                const props = item.properties;


                return {

                    name:
                        props.name ||
                        "Unnamed place",

                    category,

                    address:
                        props.formatted ||
                        "",

                    lat:
                        props.lat,

                    lon:
                        props.lon

                };

            });



        console.log(
            "Geoapify places:",
            places.length
        );


        return {

            success: true,

            tool: "placesSearchTool",

            data: places

        };


    } catch (error) {


        console.error(
            "Geoapify Error:",
            error.message
        );


        return {

            success: false,

            tool: "placesSearchTool",

            data: []

        };

    }

}