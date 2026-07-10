import axios from "axios";

export async function readFileTool({ github, filePath }) {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${github.owner}/${github.repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${github.token}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    const content = Buffer
      .from(response.data.content, "base64")
      .toString("utf8");

    return {
      success: true,
      tool: "readFileTool",
      data: {
        file: response.data.name,
        path: response.data.path,
        sha: response.data.sha,
        size: response.data.size,
        encoding: response.data.encoding,
        content
      }
    };

  } catch (err) {

    if (err.response?.status === 404) {
      return {
        success: true,
        tool: "readFileTool",
        data: {
          exists: false,
          path: filePath,
          message: `File '${filePath}' was not found.`
        }
      };
    }

    return {
      success: false,
      tool: "readFileTool",
      error: err.response?.data?.message || err.message
    };
  }
}