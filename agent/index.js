import "./bootstrap.js"; // ✅ MUST BE FIRST LINE

import { buildSamvaadGraph } from "./graph.js";
import { createInitialState } from "./state.js";


const app = buildSamvaadGraph();

const state = createInitialState(
  "Explain GitHub repository in simple words"
);

const result = await app.invoke(state);

// agent runner invoked programmatically; logging removed for cleaner output