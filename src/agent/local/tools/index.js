import { searchPlaces } from "./placesTool.js";


const placesSearchTool = {
    name: "placesSearchTool",

    async invoke(input) {

        const {
            category,
            latitude,
            longitude
        } = input;


        const result = await searchPlaces(
            category,
            latitude,
            longitude
        );


        return {
            success: true,
            tool: "placesSearchTool",
            data: result
        };
    }
};


const localTools = [
    placesSearchTool
];


export {
    localTools
};