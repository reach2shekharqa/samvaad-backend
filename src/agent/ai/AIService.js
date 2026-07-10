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
}

export default new AIService();