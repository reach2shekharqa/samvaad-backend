import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const readReadmeTool = tool(
    async ({ repositoryPath }) => {

        const possibleFiles = [
            "README.md",
            "Readme.md",
            "readme.md"
        ];

        for (const file of possibleFiles) {

            const fullPath = path.join(repositoryPath, file);

            try {

                const content = await fs.readFile(fullPath, "utf8");

                return {
                    success: true,
                    tool: "readReadmeTool",
                    data: {
                        file,
                        content
                    }
                };

            } catch {
                // Try next filename
            }
        }

        return {
            success: false,
            tool: "readReadmeTool",
            error: "README file not found."
        };

    },
    {
        name: "readReadmeTool",
        description: "Reads the README.md file from a local repository.",
        schema: z.object({
            repositoryPath: z.string().describe("Absolute path of the repository")
        })
    }
);

export default readReadmeTool;