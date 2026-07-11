import axios from "axios";
import aiService from "../../ai/AIService.js";


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

    // tumhara existing Geoapify code yaha same rahega

}



export default {

    name: "placesTool",

    description: "Search nearby places",

    async execute(input, context) {

        return await searchPlaces({

            query: input.query,

            lat: context?.location?.lat,

            lon: context?.location?.lon

        });

    }

};