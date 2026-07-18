import axios from "axios";
import discoveryCache from "../DiscoveryCache.js";

const PRIORITY_FILES = [

    "README.md",
    "readme.md",
    "README.txt",

    "package.json",

    "pom.xml",

    "build.gradle",
    "build.gradle.kts",

    "settings.gradle",
    "settings.gradle.kts",

    "requirements.txt",
    "pyproject.toml",
    "setup.py",

    "composer.json",

    "Cargo.toml",

    "go.mod",

    "pubspec.yaml",

    "Gemfile",

    "Makefile",

    "Dockerfile",

    "docker-compose.yml"

];

export const discoverRepositoryTool = {

    name: "discoverRepositoryTool",

    description:
        "Discover repository structure and important files.",

    execute

};

async function execute({ github }) {

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

            tool: "discoverRepositoryTool",

            error: "Invalid GitHub context."

        };

    }

    console.log("================================");
    console.log("📦 DISCOVER REPOSITORY");
    console.log(
        "Repository:",
        `${github.owner}/${github.repo}`
    );
    console.log("================================");

    // ------------------------------------
    // Cache
    // ------------------------------------

    const cached =
        discoveryCache.get(
            github.owner,
            github.repo
        );

    if (cached) {

        console.log(
            `✅ CACHE HIT: ${github.owner}/${github.repo}`
        );

        return {

            success: true,

            tool: "discoverRepositoryTool",

            fromCache: true,

            data: cached

        };

    }

    try {

        const headers = {

            Authorization:
                `Bearer ${github.token}`,

            Accept:
                "application/vnd.github+json"

        };

        // ------------------------------------
        // Repository Information
        // ------------------------------------

        const repoResponse =
            await axios.get(

                `https://api.github.com/repos/${github.owner}/${github.repo}`,

                {
                    headers
                }

            );

        const defaultBranch =
            repoResponse.data.default_branch || "main";

        // ------------------------------------
        // Repository Tree
        // ------------------------------------

        const treeResponse =
            await axios.get(

                `https://api.github.com/repos/${github.owner}/${github.repo}/git/trees/${defaultBranch}?recursive=1`,

                {
                    headers
                }

            );

        const tree =
            treeResponse.data.tree || [];

        const files = [];

        const directories = [];

        const rootFiles = [];

        for (const item of tree) {

            if (item.type === "blob") {

                files.push(item.path);

                if (!item.path.includes("/")) {

                    rootFiles.push(item.path);

                }

            }

            if (item.type === "tree") {

                directories.push(item.path);

            }

        }

        // ------------------------------------
        // Priority Files
        // ------------------------------------

        const recommendedFiles = [];

        for (const file of PRIORITY_FILES) {

            const match =
                files.find(

                    f =>
                        f.toLowerCase() ===
                        file.toLowerCase()

                );

            if (match) {

                recommendedFiles.push(match);

            }

        }        // ------------------------------------
        // Build Discovery Data
        // ------------------------------------

        const data = {

            owner:
                github.owner,

            repository:
                github.repo,

            defaultBranch,

            totalFiles:
                files.length,

            totalDirectories:
                directories.length,

            files,

            rootFiles,

            directories,

            recommendedFiles,

            repositoryInfo: {

                name:
                    repoResponse.data.name,

                fullName:
                    repoResponse.data.full_name,

                description:
                    repoResponse.data.description,

                language:
                    repoResponse.data.language,

                visibility:
                    repoResponse.data.visibility,

                stars:
                    repoResponse.data.stargazers_count,

                forks:
                    repoResponse.data.forks_count,

                watchers:
                    repoResponse.data.watchers_count,

                openIssues:
                    repoResponse.data.open_issues_count,

                defaultBranch,

                homepage:
                    repoResponse.data.homepage,

                topics:
                    repoResponse.data.topics || [],

                license:
                    repoResponse.data.license?.name || null

            }

        };

        // ------------------------------------
        // Cache
        // ------------------------------------

        discoveryCache.set(

            github.owner,

            github.repo,

            data

        );

        console.log(
            `💾 CACHE SET: ${github.owner}/${github.repo}`
        );

        console.log("📊 Repository Summary");

        console.log(
            "Files       :",
            files.length
        );

        console.log(
            "Directories :",
            directories.length
        );

        console.log(
            "Recommended :",
            recommendedFiles.length
        );

        return {

            success: true,

            tool: "discoverRepositoryTool",

            fromCache: false,

            data

        };

    }
    catch (err) {

        console.error(
            "❌ DISCOVERY ERROR"
        );

        console.error(
            err.response?.data || err.message
        );

        return {

            success: false,

            tool: "discoverRepositoryTool",

            error:
                err.response?.data?.message ||
                err.message

        };

    }

}

export default {

    name: "discoverRepositoryTool",

    description:
        "Discover repository structure and important files.",

    execute

};