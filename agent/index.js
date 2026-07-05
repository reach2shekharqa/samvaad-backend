import "./bootstrap.js"; // ✅ MUST BE FIRST LINE

import { buildSamvaadGraph } from "./graph.js";
import { createInitialState } from "./state.js";

console.log("GROQ KEY CHECK:", process.env.GROQ_API_KEY);

const app = buildSamvaadGraph();

const state = createInitialState(
  "Explain GitHub repository in simple words"
);

const result = await app.invoke(state);

console.log("\nFINAL RESPONSE:\n");
console.log(result.response);