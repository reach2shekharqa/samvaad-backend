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


    try {


        console.log(
            "DEBUG: Discovering repo:",
            github.owner,
            "/",
            github.repo
        );



        // ---------------- CACHE ----------------

        const cached =
            discoveryCache.get(
                github.owner,
                github.repo
            );


        if (cached) {


            console.log(
                "✅ CACHE HIT:",
                `${github.owner}/${github.repo}`
            );


            return {

                success: true,

                tool: "discoverRepositoryTool",

                fromCache: true,

                data: cached

            };

        }



        // ---------------- REPO INFO ----------------


        const repoResponse =
            await axios.get(

                `https://api.github.com/repos/${github.owner}/${github.repo}`,

                {

                    headers: {

                        Authorization:
                            `Bearer ${github.token}`,

                        Accept:
                            "application/vnd.github+json"

                    }

                }

            );



        const defaultBranch =
            repoResponse.data.default_branch || "main";



        // ---------------- TREE ----------------


        const treeResponse =
            await axios.get(

                `https://api.github.com/repos/${github.owner}/${github.repo}/git/trees/${defaultBranch}?recursive=1`,

                {

                    headers: {

                        Authorization:
                            `Bearer ${github.token}`,

                        Accept:
                            "application/vnd.github+json"

                    }

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


                // root level file only
                if (!item.path.includes("/")) {

                    rootFiles.push(item.path);

                }

            }



            if (item.type === "tree") {

                directories.push(item.path);

            }

        }



        // ---------------- IMPORTANT FILES ----------------


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

        }




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


                description:
                    repoResponse.data.description,


                language:
                    repoResponse.data.language,


                visibility:
                    repoResponse.data.visibility,


                stars:
                    repoResponse.data.stargazers_count,


                forks:
                    repoResponse.data.forks_count

            }

        };



        discoveryCache.set(

            github.owner,

            github.repo,

            data

        );



        console.log(
            `💾 CACHE SET: ${github.owner}/${github.repo}`
        );



        return {


            success: true,


            tool:
                "discoverRepositoryTool",


            fromCache:
                false,


            data

        };



    } catch(err) {


        return {


            success:false,


            tool:
                "discoverRepositoryTool",


            error:
                err.response?.data?.message ||
                err.message


        };

    }

}



export default discoverRepositoryTool;