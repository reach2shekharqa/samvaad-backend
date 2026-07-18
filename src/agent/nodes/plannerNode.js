import aiService from "../ai/AIService.js";

const MAX_ITERATIONS = 5;

const PREFERRED_ROOT_FILES = [

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

export async function plannerNode(state) {

    const evidence =
        state.evidence || [];

    const iteration =
        (state.iteration || 0) + 1;

    console.log("================================");
    console.log("🧠 PLANNER");
    console.log("Iteration :", iteration);

    console.log(
        "Evidence :",
        evidence.map(e => ({
            tool: e.tool,
            success: e.result?.success
        }))
    );

    console.log("================================");

    //---------------------------------------
    // Maximum Iterations
    //---------------------------------------

    if (iteration >= MAX_ITERATIONS) {

        console.log(
            "🛑 Max iterations reached."
        );

        return {

            ...state,

            iteration,

            action: "final",

            tools: []

        };

    }

    //---------------------------------------
    // Repository Discovery
    //---------------------------------------

    const discoveryEvidence =
        evidence.find(

            e =>
                e.tool === "discoverRepositoryTool"

        );

    if (
        !discoveryEvidence ||
        !discoveryEvidence.result?.success
    ) {

        console.log(
            "🧠 Planner -> discoverRepositoryTool"
        );

        return {

            ...state,

            iteration,

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

    const repository =
        discoveryEvidence.result.data;

    //---------------------------------------
    // Already Read Files
    //---------------------------------------

    const readFiles = [

        ...new Set(

            evidence

                .filter(

                    e =>
                        e.tool === "readFileTool" &&
                        e.result?.success

                )

                .map(
                    e => e.result.data?.path
                )

                .filter(Boolean)

        )

    ];

    console.log(
        "📚 Already Read:",
        readFiles
    );

    //---------------------------------------
    // Recommended Files
    //---------------------------------------

    let nextFile =
        (repository.recommendedFiles || [])

            .find(

                file =>
                    !readFiles.includes(file)

            );

    //---------------------------------------
    // Root File Fallback
    //---------------------------------------

    if (!nextFile) {

        nextFile =
            PREFERRED_ROOT_FILES.find(

                file =>

                    repository.rootFiles.includes(file)

                    &&

                    !readFiles.includes(file)

            );

    }

    //---------------------------------------
    // If file found → read it
    //---------------------------------------

    if (nextFile) {

        console.log(
            "📄 Planner ->",
            nextFile
        );

        return {

            ...state,

            iteration,

            action: "tool",

            tools: [

                {

                    name:
                        "readFileTool",

                    input: {

                        github:
                            state.context.github,

                        filePath:
                            nextFile

                    }

                }

            ]

        };

    }

    //---------------------------------------
    // LLM Decision
    //---------------------------------------

    console.log(
        "🤖 Planner -> LLM"
    );    const result =
        await aiService.chat({

            systemPrompt: `

You are Samvaad Planner.

The repository has already been discovered.

Your job is to decide ONE next file that should be read to answer the user's question.

Rules:

- Return ONLY valid JSON.
- Never explain.
- Select ONLY ONE file.
- Select ONLY from repository.files.
- Never select a file already present in readFiles.
- Prefer entry points, configuration files, source files and documentation.
- If no additional file is useful, return final.

Response format:

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

OR

{
  "action":"final"
}

`,

            userPrompt: JSON.stringify({

                question: state.input,

                repository: {

                    recommendedFiles:
                        repository.recommendedFiles,

                    rootFiles:
                        repository.rootFiles,

                    files:
                        repository.files

                },

                readFiles

            }),

            temperature: 0

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

    }
    catch {

        parsed = {

            action: "final"

        };

    }

    let action =
        (parsed.action || "final")
            .toLowerCase();

    if (
        !["tool", "final"]
            .includes(action)
    ) {

        action = "final";

    }

    const tools =
        (parsed.tools || [])

            .map(tool => {

                if (
                    tool.name !== "readFileTool"
                ) {

                    return null;

                }

                if (
                    !tool.input?.filePath
                ) {

                    return null;

                }

                if (
                    readFiles.includes(
                        tool.input.filePath
                    )
                ) {

                    return null;

                }

                return {

                    name: "readFileTool",

                    input: {

                        github:
                            state.context.github,

                        filePath:
                            tool.input.filePath

                    }

                };

            })

            .filter(Boolean);

    if (
        action === "tool" &&
        tools.length === 0
    ) {

        action = "final";

    }

    console.log(
        "🧠 Planner Action:",
        action
    );

    if (tools.length) {

        console.log(
            "📄 Next File:",
            tools[0].input.filePath
        );

    }

    return {

        ...state,

        iteration,

        action,

        tools

    };

}