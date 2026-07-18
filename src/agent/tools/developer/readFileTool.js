import axios from "axios";

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

async function execute({ github, filePath }) {

    // ------------------------------------
    // Validate Input
    // ------------------------------------

    if (
        !github ||
        !github.owner ||
        !github.repo ||
        !github.token
    ) {

        return {

            success: false,

            tool: "readFileTool",

            error: "Invalid GitHub context."

        };

    }

    if (!filePath) {

        return {

            success: false,

            tool: "readFileTool",

            error: "No file path provided."

        };

    }

    console.log("================================");
    console.log("📄 READ FILE");
    console.log("Repository :", `${github.owner}/${github.repo}`);
    console.log("File       :", filePath);
    console.log("================================");

    try {

        const response =
            await axios.get(

                `https://api.github.com/repos/${github.owner}/${github.repo}/contents/${filePath}`,

                {

                    headers: {

                        Authorization:
                            `Bearer ${github.token}`,

                        Accept:
                            "application/vnd.github+json"

                    }

                }

            );

        // ------------------------------------
        // Skip directories
        // ------------------------------------

        if (response.data.type === "dir") {

            return {

                success: false,

                tool: "readFileTool",

                error: `${filePath} is a directory.`

            };

        }

        // ------------------------------------
        // Skip huge files
        // ------------------------------------

        if (response.data.size > MAX_FILE_SIZE) {

            return {

                success: true,

                tool: "readFileTool",

                data: {

                    file: response.data.name,

                    path: response.data.path,

                    size: response.data.size,

                    skipped: true,

                    reason: "File too large."

                }

            };

        }

        // ------------------------------------
        // Decode Base64
        // ------------------------------------

        let content = "";

        try {

            content =
                Buffer
                    .from(
                        response.data.content,
                        "base64"
                    )
                    .toString("utf8");

        }
        catch {

            return {

                success: false,

                tool: "readFileTool",

                error:
                    "Unable to decode file."

            };

        }

        console.log(
            "✅ File Read:",
            response.data.path
        );

        console.log(
            "Characters:",
            content.length
        );

        return {

            success: true,

            tool: "readFileTool",

            data: {

                file:
                    response.data.name,

                path:
                    response.data.path,

                sha:
                    response.data.sha,

                size:
                    response.data.size,

                encoding:
                    response.data.encoding,

                content

            }

        };

    }
    catch (err) {

        console.error(
            "❌ READ FILE ERROR"
        );

        console.error(
            err.response?.data || err.message
        );

        if (err.response?.status === 404) {

            return {

                success: true,

                tool: "readFileTool",

                data: {

                    exists: false,

                    path: filePath,

                    message:
                        `File '${filePath}' was not found.`

                }

            };

        }

        if (err.response?.status === 403) {

            return {

                success: false,

                tool: "readFileTool",

                error:
                    "GitHub API rate limit exceeded."

            };

        }

        return {

            success: false,

            tool: "readFileTool",

            error:
                err.response?.data?.message ||
                err.message

        };

    }

}

export default {

    name: "readFileTool",

    description:
        "Read repository file content.",

    execute

};