import express from "express";
import { getHora } from "../src/agent/tools/day/horaTool.js";

const router = express.Router();

router.get("/hora", async (req, res) => {

    const result = await getHora({

        latitude: 28.6139,
        longitude: 77.2090,
        language: "en"

    });

    res.json(result);

});

export default router;