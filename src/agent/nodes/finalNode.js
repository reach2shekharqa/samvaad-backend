import aiService from "../ai/AIService.js";

export async function finalNode(state) {

    const evidence = state.evidence || [];

    if (evidence.length === 0) {

        return {

            ...state,

            finalResponse:
                "I couldn't collect enough information to answer your question."

        };

    }

    const failures =
        evidence.filter(
            e => e.result?.success === false
        );

    if (failures.length === evidence.length) {

        const message =
            failures
                .map(
                    f => `${f.tool}: ${f.result.error}`
                )
                .join("\n");

        return {

            ...state,

            finalResponse: message

        };

    }

    console.log("================================");
    console.log("🧠 FINAL NODE");
    console.log("Question :", state.input);
    console.log("Evidence :", evidence.length);
    console.log("================================");

    // --------------------------------
    // Build Repository Evidence
    // --------------------------------

    const repositoryEvidence =
        evidence.map(e => {

            if (
                e.tool === "readFileTool" &&
                e.result?.success
            ) {

                return {

                    tool: e.tool,

                    file: e.result.data.path,

                    content:
                        (e.result.data.content || "")
                            .substring(0, 5000)

                };

            }

            if (
                e.tool === "discoverRepositoryTool" &&
                e.result?.success
            ) {

                return {

                    tool: e.tool,

                    repository:
                        e.result.data.repository,

                    language:
                        e.result.data.repositoryInfo?.language,

                    recommendedFiles:
                        e.result.data.recommendedFiles,

                    rootFiles:
                        e.result.data.rootFiles,

                    repositoryInfo:
                        e.result.data.repositoryInfo

                };

            }

            return {

                tool: e.tool,

                success:
                    e.result?.success,

                error:
                    e.result?.error

            };

        });

    console.log(
        "📚 Repository Evidence:"
    );

    console.log(
        JSON.stringify(
            repositoryEvidence,
            null,
            2
        )
    );

    let answer;

    try {

        answer =
            await aiService.chat({

                systemPrompt: `

You are Samvaad Repository AI.

Your job is to answer repository questions using ONLY the supplied evidence.

Rules:

- Never invent files.
- Never invent frameworks.
- Never invent architecture.
- Never invent dependencies.
- Use repository metadata when available.
- Use file contents when available.
- Mention the files actually analyzed.
- If evidence is insufficient, clearly explain what information is missing.
- Produce clear technical explanations.

`,

                userPrompt: `

QUESTION

${state.input}

--------------------------------

REPOSITORY EVIDENCE

${JSON.stringify(
                    repositoryEvidence,
                    null,
                    2
                )}

`

            });

    }
    catch (error) {

        console.error(
            "❌ FINAL NODE ERROR"
        );

        console.error(error);

        return {

            ...state,

            finalResponse:
                "Unable to generate a response due to an internal AI service error."

        };

    }

    const cleaned =
        typeof answer === "string"

            ? answer
                .replace(/```/g, "")
                .trim()

            : JSON.stringify(
                answer,
                null,
                2
            );

    console.log(
        "✅ Final response generated."
    );

    return {

        ...state,

        finalResponse: cleaned

    };

}