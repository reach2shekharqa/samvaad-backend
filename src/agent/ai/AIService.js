import { groq } from "../config/groqClient.js";

class AIService {

  async chat({
    systemPrompt,
    userPrompt,
    temperature = 0,
    responseFormat = null,
    maxRetries = 3
  }) {

    const request = {
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      temperature,
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful assistant."
        },
        {
          role: "user",
          content: userPrompt || ""
        }
      ]
    };

    if (!userPrompt) {
      throw new Error("AIService: userPrompt missing");
    }

    if (responseFormat) {
      request.response_format = responseFormat;
    }

    let attempt = 0;

    while (attempt < maxRetries) {
      try {

        const response = await groq.chat.completions.create(request);

        return response.choices[0].message.content;

      } catch (err) {

        attempt++;

        const status = err?.status || err?.statusCode;

        if (status === 429) {
          const retryAfter =
            err?.headers?.["retry-after"]
              ? parseInt(err.headers["retry-after"])
              : 2;

          console.warn(`⚠️ Rate limited. Retry ${attempt}/${maxRetries}`);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }

        if (attempt < maxRetries) {
          console.warn(`⚠️ Retry ${attempt}/${maxRetries}`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }

        console.error("❌ AIService failed:", err);

        return JSON.stringify({
          action: "finish",
          reason: "AI failure fallback"
        });
      }
    }
  }

  async normalizePlaceQuery(query) {

    const response = await this.chat({

      systemPrompt: `
You normalize local search queries.

Return ONLY valid JSON.

{
  "category": "",
  "keywords": ""
}

Rules:

- Fix spelling mistakes.
- Convert synonyms to a standard category.
- Never explain.
- Never use markdown.

Examples:

restaurant
restaurants
resturant
restuarant
food
eat
dinner
lunch

→

{
 "category":"restaurant",
 "keywords":"restaurant"
}

parking
car parking
park my car

→

{
 "category":"parking",
 "keywords":"parking"
}

hospital
clinic

→

{
 "category":"hospital",
 "keywords":"hospital"
}

pharmacy
chemist
medicine shop

→

{
 "category":"pharmacy",
 "keywords":"pharmacy"
}

coffee
coffee shop
cafe

→

{
 "category":"cafe",
 "keywords":"cafe"
}

hotel
stay

→

{
 "category":"hotel",
 "keywords":"hotel"
}
`,

      userPrompt: query,

      temperature: 0

    });

    return JSON.parse(response);

  }
}

export default new AIService();