import { discoverRepositoryTool } from "../../tools/discoverRepositoryTool.js";
import { readFileTool } from "../../tools/readFileTool.js";

export async function toolNode(state) {

  const github = state.github || (state.context && state.context.github) || {};
  const userQuery = (state.input || "").toLowerCase();
  const iteration = (state.iteration || 0);

  console.log(`🔧 TOOL STEP [iteration: ${iteration}]`);
  console.log(`❓ User Question: "${state.input || ""}"`);

  const structuredResults = {
    repository: {
      owner: github.owner || "",
      name: github.repo || "",
      query: userQuery
    },
    metadata: {},
    relevantFiles: {}
  };

  try {
    // 1) Discover repository structure
    console.log("DEBUG: Attempting discovery for:", { owner: github.owner, repo: github.repo });
    const discover = await discoverRepositoryTool({ github });
    console.log("DEBUG: Discovery result success:", discover?.success, "fromCache:", discover?.fromCache, "error:", discover?.error);
    if (discover && discover.success) {
      structuredResults.metadata = {
        totalFiles: discover.data?.totalFiles || 0,
        totalDirectories: discover.data?.totalDirectories || 0,
        defaultBranch: discover.data?.defaultBranch || "main"
      };

      const files = discover.data?.files || [];

      // 2) Map user query to file patterns
      const filePatterns = getFilePatterns(userQuery);
      const relevantFiles = findRelevantFiles(files, filePatterns);

      // 3) Read relevant files and extract structured data
      for (const filePath of relevantFiles.slice(0, 5)) { // Limit to 5 files
        try {
          const fileContent = await readFileTool({ github, filePath });
          
          if (fileContent && fileContent.success && fileContent.data?.content) {
            const content = fileContent.data.content;
            
            // Parse based on file type
            if (filePath.includes("package.json")) {
              try {
                const parsed = JSON.parse(content);
                structuredResults.relevantFiles.packageJson = {
                  name: parsed.name || "",
                  description: parsed.description || "",
                  dependencies: Object.keys(parsed.dependencies || {}).slice(0, 15),
                  devDependencies: Object.keys(parsed.devDependencies || {}).slice(0, 5),
                  scripts: parsed.scripts || {}
                };
              } catch (e) {}
            } else if (/(readme|^\.md|requirements|setup|install|getting-started)/i.test(filePath)) {
              structuredResults.relevantFiles[filePath] = content.slice(0, 3000); // First 3000 chars
            } else if (/(^\.yml|^\.yaml|dockerfile|docker-compose|\.json|\.ts|\.js)/i.test(filePath)) {
              structuredResults.relevantFiles[filePath] = {
                path: filePath,
                preview: content.slice(0, 1500), // First 1500 chars as preview
                size: content.length
              };
            }
          }
        } catch (err) {
          console.error(`Failed to read ${filePath}:`, err.message);
        }
      }

      // Additional pass: if user explicitly asked about fixtures, search candidate files for 'fixture' mentions
      if (/\bfixture(s)?\b/i.test(userQuery)) {
        console.log("DEBUG: Fixture query detected — scanning for fixture implementations");

        // Candidates: files that include 'fixture' in path or are JS/TS files in tests or fixtures dirs
        const fixtureCandidates = files.filter(f => /fixture/i.test(f) || /tests\/.+\.(ts|js)$|\.spec\.(ts|js)$/i.test(f));

        for (const filePath of fixtureCandidates.slice(0, 10)) {
          try {
            const fileContent = await readFileTool({ github, filePath });
            if (fileContent && fileContent.success && fileContent.data?.content) {
              const content = fileContent.data.content;
              if (/\bfixture\b|PageFixture|fixtures\//i.test(content)) {
                structuredResults.relevantFiles[filePath] = {
                  path: filePath,
                  preview: content.slice(0, 2500),
                  size: content.length
                };
              }
            }
          } catch (err) {
            // ignore read errors
          }
        }

        if (Object.keys(structuredResults.relevantFiles).length > 0) {
          console.log("DEBUG: Found fixture-related files:", Object.keys(structuredResults.relevantFiles));
        }
      }

      // 4) If no files found from patterns, fallback to README or main files
      if (Object.keys(structuredResults.relevantFiles).length === 0) {
        // Try alternative documentation files
        const altDocFiles = [
          "README.md", "README.txt", "readme.md", "readme.txt",
          "INTRO.md", "PROJECT.md", "OVERVIEW.md", "ABOUT.md",
          "src/index.ts", "src/index.js", "index.ts", "index.js",
          "app/index.ts", "app/index.js", "main.ts", "main.js",
          "package.json"
        ];

        for (const filePath of altDocFiles) {
          if (files.includes(filePath)) {
            try {
              const fileContent = await readFileTool({ github, filePath });
              if (fileContent && fileContent.success && fileContent.data?.content) {
                if (filePath.includes("package.json")) {
                  try {
                    const parsed = JSON.parse(fileContent.data.content);
                    structuredResults.relevantFiles.packageJson = {
                      name: parsed.name || "",
                      description: parsed.description || "",
                      dependencies: Object.keys(parsed.dependencies || {}).slice(0, 15),
                      devDependencies: Object.keys(parsed.devDependencies || {}).slice(0, 5),
                      scripts: parsed.scripts || {}
                    };
                  } catch (e) {}
                } else {
                  structuredResults.relevantFiles[filePath] = fileContent.data.content.slice(0, 2500);
                }
              }
            } catch (err) {
              // continue to next file
            }
          }
        }
      }

      // 5) If still no content found, provide directory structure analysis
      if (Object.keys(structuredResults.relevantFiles).length === 0) {
        structuredResults.relevantFiles.directoryStructure = {
          topLevelDirs: files.filter(f => f.split("/").length === 1 && !f.includes(".")).slice(0, 15),
          mainFiles: files.filter(f => f.split("/").length === 1 && f.includes(".")).slice(0, 10)
        };
      }

    } else {
      // Discovery failed - repository not found or inaccessible
      structuredResults.error = {
        type: "repository_not_found",
        message: discover?.error || "Repository could not be accessed",
        owner: github.owner,
        repo: github.repo,
        suggestion: "Please verify the repository name and ensure it's public or you have access to it."
      };
      console.error("Tool failed: discoverRepositoryTool -", discover?.error);
    }

    console.log("STAGE: Tool [discoverRepositoryTool, readFileTool]");

  } catch (err) {
    console.error("Tool node error:", err && err.message ? err.message : err);
    structuredResults.error = {
      type: "tool_error",
      message: err.message
    };
  }

  return {
    ...state,
    evidence: [structuredResults],
    action: "planner"
  };
}

// Map user query to relevant file patterns
function getFilePatterns(query) {
  const patterns = [];

  if (query.match(/readme|about|overview|description|project|what|purpose|intro/i)) {
    patterns.push("readme", "contributing", "getting-started", "setup", "install");
  }
  if (query.match(/tech|stack|framework|library|dependency|dependencies|language/i)) {
    patterns.push("package.json", "requirements.txt", "go.mod", "pom.xml", "build.gradle");
  }
  if (query.match(/docker|container|deployment|deploy|config/i)) {
    patterns.push("dockerfile", "docker-compose", ".env", "config", "deployment");
  }
  if (query.match(/test|unit test|integration|e2e/i)) {
    patterns.push("test", "spec", ".test.ts", ".test.js", "jest.config");
  }
  if (query.match(/structure|folder|directory|layout|architecture/i)) {
    patterns.push("src", "app", "main", "index");
  }

  // Default to README
  if (patterns.length === 0) {
    patterns.push("readme", "package.json");
  }

  return patterns;
}

// Find files matching patterns
function findRelevantFiles(files, patterns) {
  const relevant = [];
  const patternRegex = new RegExp(patterns.join("|"), "i");

  for (const file of files) {
    if (patternRegex.test(file) && !file.includes("node_modules") && !file.includes(".git")) {
      relevant.push(file);
    }
  }

  return relevant.length > 0 ? relevant : files.filter(f => !f.includes("node_modules")).slice(0, 3);
}
