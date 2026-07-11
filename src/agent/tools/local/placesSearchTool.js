import { searchPlaces } from "./placesTool.js";

async function invoke({
    category,
    latitude,
    longitude,
    query
}) {

    return await searchPlaces({

        query: query || category,

        lat: latitude,

        lon: longitude

    });

}

export default {

    name: "placesSearchTool",

    description:
        "Search nearby places like restaurants, hospitals, parking and shops.",

    invoke

};