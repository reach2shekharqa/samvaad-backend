import dotenv from "dotenv";
dotenv.config();

export async function getProkeralaToken() {
  const token = process.env.PROKERALA_API_TOKEN;
  if (token) {
    return token;
  }

  const clientId = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Prokerala auth configuration. Set PROKERALA_API_TOKEN or PROKERALA_CLIENT_ID and PROKERALA_CLIENT_SECRET."
    );
  }

  throw new Error(
    "PROKERALA_API_TOKEN is not configured. Please add it to your environment or implement the token exchange flow."
  );
}
