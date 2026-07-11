import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

let cachedToken = null;
let tokenExpiry = 0;

export async function getProkeralaToken() {

    // Return cached token if still valid
    if (
        cachedToken &&
        Date.now() < tokenExpiry
    ) {
        return cachedToken;
    }

    const clientId =
        process.env.PROKERALA_CLIENT_ID;

    const clientSecret =
        process.env.PROKERALA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {

        throw new Error(
            "Missing PROKERALA_CLIENT_ID or PROKERALA_CLIENT_SECRET."
        );

    }

    try {

        console.log("🔑 Fetching Prokerala OAuth token...");

        const params =
            new URLSearchParams();

        params.append(
            "grant_type",
            "client_credentials"
        );

        params.append(
            "client_id",
            clientId
        );

        params.append(
            "client_secret",
            clientSecret
        );

        const response =
            await axios.post(

                "https://api.prokerala.com/token",

                params,

                {

                    headers: {

                        "Content-Type":
                            "application/x-www-form-urlencoded"

                    },

                    timeout: 15000

                }

            );

        cachedToken =
            response.data.access_token;

        const expiresIn =
            response.data.expires_in || 3600;

        // Refresh 60 seconds before expiry
        tokenExpiry =
            Date.now() +
            ((expiresIn - 60) * 1000);

        console.log("✅ Prokerala token acquired");

        return cachedToken;

    }
    catch (error) {

        console.error(
            "❌ Failed to fetch Prokerala token:",
            error.response?.data || error.message
        );

        throw new Error(
            "Unable to obtain Prokerala access token."
        );

    }

}