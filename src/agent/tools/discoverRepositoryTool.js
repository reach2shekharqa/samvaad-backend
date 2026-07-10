import axios from "axios";
import discoveryCache from "./DiscoveryCache.js";

export async function discoverRepositoryTool({ github }) {

  try {
    console.log("DEBUG: Discovering repo:", github.owner, "/", github.repo);

    // Check cache first
    const cached = discoveryCache.get(github.owner, github.repo);
    if (cached) {
      return {
        success: true,
        tool: "discoverRepositoryTool",
        data: cached,
        fromCache: true
      };
    }

    const repoResponse = await axios.get(
      `https://api.github.com/repos/${github.owner}/${github.repo}`,
      {
        headers: {
          Authorization: `Bearer ${github.token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    const defaultBranch = repoResponse.data.default_branch || repoResponse.data.defaultBranch || "main";
    console.log("DEBUG: Repo found, branch:", defaultBranch);

    const treeResponse = await axios.get(
      `https://api.github.com/repos/${github.owner}/${github.repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${github.token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    const tree = treeResponse.data.tree || [];

    const files = [];
    const directories = [];

    for (const item of tree) {
      if (item.type === "blob") files.push(item.path);
      if (item.type === "tree") directories.push(item.path);
    }

    const discoveryData = {
      defaultBranch,
      totalFiles: files.length,
      totalDirectories: directories.length,
      files,
      directories
    };

    // Cache the result
    discoveryCache.set(github.owner, github.repo, discoveryData);

    return {
      success: true,
      tool: "discoverRepositoryTool",
      data: discoveryData,
      fromCache: false
    };

  } catch (err) {
    return {
      success: false,
      tool: "discoverRepositoryTool",
      error: err.response?.data?.message || err.message
    };
  }
}