export function echoNode(state) {
  return {
    ...state,
    response: `Samvaad Agent received: ${state.input}`
  };
}