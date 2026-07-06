import axios from "axios";

export async function discoverRepositoryTool({ github }) {

  try {
    console.log("DEBUG: Discovering repo:", github.owner, "/", github.repo);
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

    return {
      success: true,
      tool: "discoverRepositoryTool",
      data: {
        defaultBranch,
        totalFiles: files.length,
        totalDirectories: directories.length,
        files,
        directories
      }
    };

  } catch (err) {
    return {
      success: false,
      tool: "discoverRepositoryTool",
      error: err.response?.data?.message || err.message
    };
  }
}