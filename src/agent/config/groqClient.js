import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "FOUND" : "MISSING");
console.log(
  "GROQ env keys:",
  Object.keys(process.env).filter(k => k.includes("GROQ"))
);

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});