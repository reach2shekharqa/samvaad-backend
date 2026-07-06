export function routerNode(state) {

  const iteration = (state.iteration || 0) + 1;

  return {
    ...state,
    iteration,
    evidence: Array.isArray(state.evidence) ? state.evidence : []
  };
}