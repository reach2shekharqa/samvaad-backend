import aiService from "../ai/AIService.js";


export async function responseNode(state) {


    try {


        if (!state.evidence) {

            return {

                ...state,

                finalResponse:
                    "No evidence found to generate summary."

            };

        }



        // --------------------------------
        // BUILD CLEAN EVIDENCE CONTEXT
        // --------------------------------

        const evidence =
            state.evidence.items ||
            state.evidence;



        const cleanEvidence =
            evidence.map(item => {


                if (item.type === "file") {


                    return {

                        type: "file",

                        filePath:
                            item.filePath,

                        content:
                            item.content || ""

                    };

                }



                if (item.type === "repo") {


                    return {

                        type: "repository",

                        totalFiles:
                            item.totalFiles,

                        totalDirectories:
                            item.totalDirectories,

                        recommendedFiles:
                            item.recommendedFiles,

                        repositoryInfo:
                            item.repositoryInfo

                    };

                }



                return item;


            });



        console.log(
            "📚 FINAL LLM EVIDENCE:",
            JSON.stringify(cleanEvidence, null, 2)
        );




        const result =
            await aiService.chat({


                systemPrompt: `

You are a senior software architect.

Generate a repository summary using ONLY the provided evidence.

Rules:

- Never invent files, languages, frameworks or features.
- Use actual file contents when available.
- If information is missing write "Not found in evidence".
- Do not mention that evidence is missing repeatedly.
- Provide a useful engineering summary.

Format:

# Project Overview

# Technology Stack

# Architecture

# Important Files

# Key Features

`,



                userPrompt: `

Repository:

${JSON.stringify(
    state.github || {},
    null,
    2
)}



Collected Evidence:

${JSON.stringify(
    cleanEvidence,
    null,
    2
)}



Create the repository summary.

`

,

                temperature:0

            });





        return {


            ...state,


            finalResponse:
                result


        };



    }
    catch(error) {


        console.error(
            "❌ RESPONSE NODE ERROR:",
            error
        );


        return {


            ...state,


            finalResponse:
                "Failed to generate final summary."

        };


    }


}