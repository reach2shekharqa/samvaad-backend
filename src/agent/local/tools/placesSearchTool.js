import { searchPlaces } from "./placesTool.js";


export async function placesSearchTool({
    category,
    latitude,
    longitude
}) {

    try {

        const places = await searchPlaces(
            category,
            latitude,
            longitude
        );


        return {
            success: true,
            tool: "placesSearchTool",
            data: places
        };

    } catch (err) {

        return {
            success: false,
            tool: "placesSearchTool",
            error: err.message
        };
    }
}