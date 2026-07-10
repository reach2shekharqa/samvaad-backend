import aiService from "../ai/AIService.js";

export async function finalNode(state) {

  // Check if tool discovered an error (repo not found, access denied, etc.)
  const evidence = Array.isArray(state.evidence) ? state.evidence[0] : {};
  
  if (evidence.error) {
    console.log("STAGE: Final [Repository Error]");
    const errorMsg = `⚠️ **Repository Not Found or Inaccessible**\n\nRepository: ${evidence.error.owner}/${evidence.error.repo}\nReason: ${evidence.error.message}\n\n${evidence.error.suggestion || "Please verify the repository name and ensure it's public."}`;
    console.log("OUTPUT:\n", errorMsg);
    
    return {
      ...state,
      finalResponse: errorMsg,
      action: "end"
    };
  }

  // Check if evidence was collected successfully
  const hasEvidence = (evidence && evidence.metadata) || (evidence && evidence.relevantFiles && Object.keys(evidence.relevantFiles).length > 0);

  if (!hasEvidence) {
    console.log("STAGE: Final [No Evidence - Unable to Respond]");
    return {
      ...state,
      finalResponse: "I was unable to retrieve information about the repository. The repository name or access may be incorrect. Please verify the repository name and try again.",
      action: "end"
    };
  }

  // Log which files were used
  const filesUsed = evidence.relevantFiles ? Object.keys(evidence.relevantFiles) : [];
  console.log("📄 Files used for final answer:", filesUsed.length > 0 ? filesUsed.join(", ") : "directory structure only");

  const result = await aiService.chat({
    systemPrompt: `
You are a repository analyst. Answer the user's question about the repository using ONLY the provided evidence.

Be direct, specific, and detailed. Use the evidence to support your answer.
    `,
    userPrompt: `
QUESTION:
${state.input || ""}

EVIDENCE (Repository metadata and content):
${JSON.stringify(state.evidence || [], null, 2)}

Provide a comprehensive answer to the question based on the evidence above.
    `
  });

  // Clean simple markdown fences and trim
  const cleaned = (typeof result === "string"
    ? result.replace(/```/g, "").trim()
    : JSON.stringify(result));

  console.log("STAGE: Final [LLM Response]");
  console.log("OUTPUT:\n", cleaned);

  return {
    ...state,
    finalResponse: cleaned,
    action: "end"
  };
}