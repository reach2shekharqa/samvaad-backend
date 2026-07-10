export async function searchPlaces({
    query,
    location
}) {

    console.log("📍 PLACES TOOL CALLED");
    console.log("Query:", query);
    console.log("Location:", location);


    // Temporary mock response
    return {
        places: [
            {
                name: "Saravana Bhavan",
                type: "Vegetarian Restaurant",
                rating: 4.5,
                distance: "1.2 km"
            },
            {
                name: "Green Leaf Restaurant",
                type: "Vegetarian Restaurant",
                rating: 4.3,
                distance: "2 km"
            }
        ]
    };
}