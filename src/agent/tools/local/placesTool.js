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


    console.log(
        "🔎 Searching Places:",
        {
            query,
            lat,
            lon
        }
    );


    // tumhara existing Geoapify code yaha same rahega


}



async function invoke(input) {


    return await searchPlaces({

        query:
            input.query,


        lat:
            input.location?.lat,


        lon:
            input.location?.lon

    });

}



export default {

    name:"placesTool",

    description:
        "Search nearby places",


    invoke

};