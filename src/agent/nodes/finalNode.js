import aiService from "../ai/AIService.js";


export async function finalNode(state) {


    const evidence =
        state.evidence || [];



    if (evidence.length === 0) {


        return {


            ...state,


            finalResponse:
                "I couldn't collect enough information to answer your question."


        };

    }




    const failures =
        evidence.filter(
            e =>
                e.result?.success === false
        );



    if (failures.length === evidence.length) {


        const message =
            failures
                .map(
                    f =>
                        `${f.tool}: ${f.result.error}`
                )
                .join("\n");



        return {


            ...state,


            finalResponse:
                message


        };

    }




    console.log(
        "🧠 Generating final response..."
    );





    // -----------------------------
    // Build clean repository context
    // -----------------------------


    const repositoryEvidence =
        evidence.map(e => {


            if (
                e.tool === "readFileTool" &&
                e.result?.success
            ) {


                return {


                    tool:
                        e.tool,


                    file:
                        e.result.data.path,


                    content:
                        e.result.data.content


                };

            }




            if (
                e.tool === "discoverRepositoryTool" &&
                e.result?.success
            ) {


                return {


                    tool:
                        e.tool,


                    repository:
                        e.result.data.repository,


                    language:
                        e.result.data.repositoryInfo?.language,


                    recommendedFiles:
                        e.result.data.recommendedFiles,


                    rootFiles:
                        e.result.data.rootFiles


                };

            }





            return {


                tool:
                    e.tool,


                result:
                    e.result


            };


        });






    const answer =
        await aiService.chat({


            systemPrompt:`

You are Samvaad AI.

Answer the user's repository question using ONLY the provided repository evidence.

Rules:

- Do not invent information.
- Mention files that were actually analyzed.
- Combine information from multiple files naturally.
- If evidence is insufficient, clearly say so.
- Provide technical details when architecture questions are asked.

`,



            userPrompt:`

QUESTION:

${state.input}


REPOSITORY EVIDENCE:

${JSON.stringify(
    repositoryEvidence,
    null,
    2
)}

`

        });





    const cleaned =

        typeof answer === "string"

            ? answer
                .replace(/```/g,"")
                .trim()

            :

            JSON.stringify(answer);





    return {


        ...state,


        finalResponse:
            cleaned


    };

}