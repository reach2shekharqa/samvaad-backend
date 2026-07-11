import axios from "axios";
import { getProkeralaToken } from "./prokeralaAuth.js";

export async function getHora({
    latitude,
    longitude,
    language = "en"
}) {

    try {

        const token = await getProkeralaToken();

        const now = new Date().toISOString();

        const response = await axios.get(
            "https://api.prokerala.com/v2/astrology/hora",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    ayanamsa: 1,
                    coordinates: `${latitude},${longitude}`,
                    datetime: now,
                    la: language
                },
                timeout: 15000
            }
        );

        return {
            success: true,
            data: response.data
        };

    } catch (error) {

        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

export default {

    name: "horaTool",

    description: "Get current planetary hora based on user location.",

    invoke: getHora
};