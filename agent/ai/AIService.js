import { groq } from "../config/groqClient.js";

class AIService {

    async chat({
        systemPrompt,
        userPrompt,
        temperature = 0,
        responseFormat = null
    }) {

        const request = {
            model: "llama-3.3-70b-versatile",
            temperature,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ]
        };

        if (responseFormat) {
            request.response_format = responseFormat;
        }

        const response = await groq.chat.completions.create(request);

        return response.choices[0].message.content;
    }

}

export default new AIService();