import aiService from "../ai/AIService.js";


export async function plannerNode(state) {


    const evidence =
        state.evidence || [];



    const hasDiscovery =
        evidence.some(
            e =>
                e.tool === "discoverRepositoryTool" &&
                e.result?.success
        );



    if ((state.iteration || 0) >= 5) {


        console.log(
            "🧠 Planner Action: final (max iterations)"
        );


        return {

            ...state,

            action: "final",

            tools: []

        };

    }




    // -----------------------------
    // STEP 1
    // Discover repository
    // -----------------------------


   if (!hasDiscovery) {


    console.log(
        "🧠 Planner -> discoverRepositoryTool"
    );


    return {

        ...state,

        action: "tool",


        tools: [

            {

                name:
                    "discoverRepositoryTool",

                input: {

                    github:
                        state.context?.github

                }

            }

        ]

    };

}





    const discovery =
        evidence.find(
            e =>
                e.tool === "discoverRepositoryTool"
        )?.result?.data;




    // -----------------------------
    // Already read files
    // -----------------------------


    const readFiles =
        (state.evidence?.items || [])
            .filter(
                e =>
                    e.type === "file" &&
                    e.success
            )
            .map(
                e =>
                    e.filePath
            )
            .filter(Boolean);






    // -----------------------------
    // STEP 2
    // Recommended files first
    // -----------------------------


    const recommendedFiles =
        discovery?.recommendedFiles || [];



    let nextFile =
        recommendedFiles.find(
            file =>
                !readFiles.includes(file)
        );




    // -----------------------------
    // STEP 3
    // Fallback root files
    // -----------------------------


    if (!nextFile) {


        const rootFiles =
            discovery?.rootFiles || [];



        const preferredRootFiles = [

            "Dockerfile",
            "docker-compose.yml",
            "Makefile",
            "settings.gradle",
            "build.gradle",
            "build.gradle.kts",
            "pom.xml",
            "package.json",
            "requirements.txt",
            "pyproject.toml",
            "go.mod",
            "Cargo.toml"

        ];



        nextFile =
            preferredRootFiles.find(

                file =>
                    rootFiles.includes(file) &&
                    !readFiles.includes(file)

            );

    }





    if (nextFile) {


        console.log(
            "🧠 Planner -> readFileTool:",
            nextFile
        );



        return {


            ...state,


            action: "tool",


            tools: [

                {

                    name: "readFileTool",

                    input: {

                        filePath: nextFile

                    }

                }

            ]

        };

    }





    // -----------------------------
    // STEP 4
    // LLM fallback
    // -----------------------------


    const result =
        await aiService.chat({


            systemPrompt: `

You are Samvaad Planner.

Repository files are collected.

Choose ONE file that will help understand repository architecture.

Rules:

- Select only from provided files.
- Prefer source entry points or configuration files.
- If nothing useful exists return final.

Return ONLY JSON:

{
 "action":"tool",
 "tools":[
   {
    "name":"readFileTool",
    "input":{
      "filePath":"..."
    }
   }
 ]
}

or

{
 "action":"final"
}

`,


            userPrompt: JSON.stringify({

                question: state.input,

                evidence: {

                    items:
                        state.evidence?.items || []

                }

            })

        });





    let parsed;


    try {


        parsed =
            JSON.parse(

                result
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .trim()

            );


    } catch {


        parsed = {

            action: "final"

        };

    }




    let action =
        (parsed.action || "final")
            .toLowerCase();




    if (!["tool", "final"].includes(action)) {

        action = "final";

    }





    console.log(
        `🧠 Planner Action: ${action}`
    );



    return {


        ...state,


        action,


        tools:
            parsed.tools || []


    };


}