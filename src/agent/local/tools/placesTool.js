import axios from "axios";
import aiService from "./../../ai/AIService.js";


function resolveCategory(category) {

    switch ((category || "").toLowerCase()) {

        case "restaurant":
            return "catering.restaurant";

        case "parking":
            return "parking";

        case "hospital":
            return "healthcare.hospital";

        case "pharmacy":
            return "healthcare.pharmacy";

        case "cafe":
            return "catering.cafe";

        case "hotel":
            return "accommodation.hotel";

        default:
            return null;
    }

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

        let category = resolveCategory(query);

if (!category) {

    try {

        const normalized =
            await aiService.normalizePlaceQuery(query);

        console.log("Normalized:", normalized);

        category = resolveCategory(normalized.category);

    } catch (e) {

        console.log("Normalization failed:", e.message);

    }

}

if (!category) {
    category = "commercial";
}

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